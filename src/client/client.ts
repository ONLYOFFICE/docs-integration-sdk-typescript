/**
 *
 * (c) Copyright Ascensio System SIA 2026
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import type { BuildFileRequest, BuilderRequest, BuilderResponse } from "./builder.js";
import type { CommandErrorCode, CommandRequest, CommandResponse } from "./command.js";
import type {
  ConvertFileRequest,
  ConvertFileResult,
  ConvertRequest,
  ConvertResponse,
} from "./convert.js";
import {
  BuilderError,
  CommandError,
  ConversionError,
  DocumentServerHttpError,
  DocumentServerParseError,
} from "./errors.js";
import type { ConfigResponse, FormatsResponse } from "./meta.js";
import type { ClientOptions, RequestOptions } from "./options.js";
import { DocumentServerRawClient } from "./raw.js";
import { type Attempt, transportError } from "./transport.js";

const BODY_SNIPPET_LIMIT = 512;
const NO_ERROR = 0;
const COMMAND_NOTHING_CHANGED: CommandErrorCode = 4;

function snippet(text: string): string {
  const trimmed = text.trim();

  return trimmed.length <= BODY_SNIPPET_LIMIT
    ? trimmed
    : `${trimmed.slice(0, BODY_SNIPPET_LIMIT)}…`;
}

async function readSnippet(response: Response): Promise<string> {
  try {
    return snippet(await response.text());
  } catch {
    return "";
  }
}

/** Reads a body, a connection that breaks or a deadline that runs out on the way included. */
async function readText(response: Response, attempt: Attempt): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    throw transportError(error, attempt);
  }
}

interface JsonBody {
  value: unknown;
  text: string;
}

async function readJson(response: Response, attempt: Attempt): Promise<JsonBody> {
  if (!response.ok) {
    throw new DocumentServerHttpError(response, await readSnippet(response));
  }

  const text = await readText(response, attempt);

  try {
    return { value: JSON.parse(text) as unknown, text };
  } catch (cause) {
    throw new DocumentServerParseError(
      `the document server answered with a body that is not JSON: ${snippet(text)}`,
      response,
      snippet(text),
      { cause },
    );
  }
}

/** Whether a response carries JSON rather than a file. */
function isJson(response: Response): boolean {
  const type = response.headers.get("content-type") ?? "";

  return type.split(";")[0]?.trim().toLowerCase() === "application/json";
}

async function readRecord(response: Response, attempt: Attempt): Promise<Record<string, unknown>> {
  const { value, text } = await readJson(response, attempt);

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DocumentServerParseError(
      `the document server answered with a body that is not a JSON object: ${snippet(text)}`,
      response,
      snippet(text),
    );
  }

  return value as Record<string, unknown>;
}

async function readArray(response: Response, attempt: Attempt): Promise<unknown[]> {
  const { value, text } = await readJson(response, attempt);

  if (!Array.isArray(value)) {
    throw new DocumentServerParseError(
      `the document server answered with a body that is not a JSON array: ${snippet(text)}`,
      response,
      snippet(text),
    );
  }

  return value as unknown[];
}

/**
 * The client of the document server. Each method calls one endpoint, parses the answer into
 * the type the endpoint promises, and rejects when the document server reports a failure: in
 * the status, or in a `200 OK` body, as the conversion, command and builder services do.
 *
 * Besides the errors each method lists, every method rejects with:
 *
 * - {@link DocumentServerNetworkError} when the server can't be reached or the connection
 *   breaks;
 * - {@link DocumentServerTimeoutError} when `timeoutMs` passes first;
 * - the reason of your `signal`, unchanged, when you cancel the call.
 *
 * For the untouched `Response`, use {@link DocumentServerClient.raw}.
 *
 * @example
 * ```ts
 * const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });
 *
 * const result = await client.convert(request, await jwt.signHeader(request));
 * ```
 *
 * @see [Client options](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/client.md)
 * @see [Errors](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/errors.md)
 */
export class DocumentServerClient {
  /**
   * The same endpoints, returning the untouched `Response`. The typed methods send their
   * requests through it, with the same options, headers, deadline and `fetch`.
   */
  readonly raw: DocumentServerRawClient;

  /**
   * @param options The address of the document server, and the defaults of every request.
   * @throws {TypeError} when `baseUrl` is not an absolute `http` or `https` URL, or
   * `timeoutMs` is not a whole number from `1` to `2147483647`.
   */
  constructor(options: ClientOptions) {
    this.raw = new DocumentServerRawClient(options);
  }

  /** The settings in effect: validated, with defaults, and frozen. The same object as `raw.options`. */
  get options(): Readonly<Required<ClientOptions>> {
    return this.raw.options;
  }

  #attempt(response: Response, options?: RequestOptions): Attempt {
    return {
      url: response.url,
      timeoutMs: options?.timeoutMs ?? this.options.timeoutMs,
      signal: options?.signal,
    };
  }

  /**
   * Calls `/healthcheck`.
   *
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns `true` when the server answers `true`. `false` for any other body, and for a
   * status outside the 2xx range: a server that is down is an answer, not a failure.
   */
  async healthcheck(options?: RequestOptions): Promise<boolean> {
    const response = await this.raw.healthcheck(options);

    if (!response.ok) {
      await readSnippet(response);

      return false;
    }

    return (await readText(response, this.#attempt(response, options))).trim() === "true";
  }

  /**
   * Gets `/meta/config`, where the document server describes itself: the header it expects a
   * token in, the paths of its endpoints, the largest file it accepts and the languages of the
   * editor. Takes no token.
   *
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range.
   * @throws {@link DocumentServerParseError} when the body is not a JSON object.
   */
  async getConfig(options?: RequestOptions): Promise<ConfigResponse> {
    const response = await this.raw.getConfig(options);

    return (await readRecord(
      response,
      this.#attempt(response, options),
    )) as unknown as ConfigResponse;
  }

  /**
   * Gets `/meta/formats`: every format the document server knows, what the editors can do
   * with it and what it converts to. Takes no token. Pass the result to
   * {@link formats!DocumentServerFormats | DocumentServerFormats} to look formats up.
   *
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range.
   * @throws {@link DocumentServerParseError} when the body is not a JSON array.
   */
  async getFormats(options?: RequestOptions): Promise<FormatsResponse> {
    const response = await this.raw.getFormats(options);

    return (await readArray(response, this.#attempt(response, options))) as FormatsResponse;
  }

  /**
   * Converts a document with `/converter`. The document server downloads it from
   * `request.url`.
   *
   * @example
   * ```ts
   * const result = await client.convert({
   *   filetype: "docx",
   *   key: "Khirz6zTPdfd7",
   *   outputtype: "pdf",
   *   url: "https://example.com/contract.docx",
   * });
   *
   * result.fileUrl; // https://docs.example.com/cache/files/…/output.pdf
   * ```
   *
   * @param request The conversion parameters.
   * @param token A token for the authorization header, from
   * {@link jwt!DocumentServerJwt.signHeader | DocumentServerJwt.signHeader()}. Without it, no
   * authorization header is sent: for a server without a JWT secret, or with the token in
   * `request.token`.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns `fileUrl` once `endConvert` is `true`, or `percent` while an `async` conversion
   * runs. Repeat the same request until `endConvert` is `true`.
   * @throws {@link ConversionError} when the body has an `error` code other than `0`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range.
   * @throws {@link DocumentServerParseError} when the body is not a JSON object.
   * @see [Converting documents](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/conversion.md)
   */
  async convert(
    request: ConvertRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<ConvertResponse> {
    const response = await this.raw.convert(request, token, options);
    const body = await readRecord(response, this.#attempt(response, options));
    const error = body["error"];

    if (typeof error === "number" && error !== NO_ERROR) {
      throw new ConversionError(error, response);
    }

    return body;
  }

  /**
   * Converts a document sent in the request, with `/converter/from-file`, for a file the
   * document server can't download.
   *
   * The request is `multipart/form-data`: `request` as JSON in a `params` part, then the
   * document as `file`, named after the `File`, or `document.<filetype>` for a `Blob` without
   * a name. `timeoutMs` covers the wait for the answer and stops once it arrives, so the
   * converted file can be read for as long as it takes.
   *
   * A token, in the header or in `request.token`, must carry `operation: "converter"`.
   *
   * @param request The conversion parameters, without `url`.
   * @param file The document.
   * @param token A token for the authorization header, from
   * {@link jwt!DocumentServerJwt.signHeader | DocumentServerJwt.signHeader()}. Without it, no
   * authorization header is sent: for a server without a JWT secret, or with the token in
   * `request.token`.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns `{ endConvert: true, file }`, with the converted file as an unread `Response`, or
   * `{ endConvert: false, percent }` while an `async` conversion runs. Repeat the same request,
   * which uploads the document again, until `endConvert` is `true`.
   * @throws {@link ConversionError} when the body has an `error` code other than `0`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range, `404`
   * included for a document server without this endpoint.
   * @throws {@link DocumentServerParseError} when a JSON body is not a JSON object, or is
   * neither an error nor `endConvert: false`.
   * @see [Upload the file in the request](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/conversion.md#upload-the-file-in-the-request)
   */
  async convertFromFile(
    request: ConvertFileRequest,
    file: Blob,
    token?: string,
    options?: RequestOptions,
  ): Promise<ConvertFileResult> {
    const response = await this.raw.convertFromFile(request, file, token, options);

    if (!response.ok) {
      throw new DocumentServerHttpError(response, await readSnippet(response));
    }

    if (!isJson(response)) {
      return { endConvert: true, file: response };
    }

    const body = await readRecord(response, this.#attempt(response, options));
    const { error, percent } = body;

    if (typeof error === "number" && error !== NO_ERROR) {
      throw new ConversionError(error, response);
    }

    if (body["endConvert"] !== false) {
      throw new DocumentServerParseError(
        `the document server answered with JSON rather than the converted file: ${snippet(
          JSON.stringify(body),
        )}`,
        response,
        snippet(JSON.stringify(body)),
      );
    }

    return { endConvert: false, percent: typeof percent === "number" ? percent : 0 };
  }

  /**
   * Runs a command of `/command`, the command service, picked by `request.c`.
   *
   * @example
   * ```ts
   * const { users } = await client.command({ c: "info", key: "Khirz6zTPdfd7" });
   * ```
   *
   * @param request The command and its parameters.
   * @param token A token for the authorization header, from
   * {@link jwt!DocumentServerJwt.signHeader | DocumentServerJwt.signHeader()}. Without it, no
   * authorization header is sent: for a server without a JWT secret, or with the token in
   * `request.token`.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns The response. `error` is `0`, or `4` when there was nothing to save since the
   * last save: an outcome of `forcesave`, not a failure.
   * @throws {@link CommandError} when `error` is neither `0` nor `4`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range.
   * @throws {@link DocumentServerParseError} when the body is not a JSON object.
   * @see [Commands](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/commands.md)
   */
  async command(
    request: CommandRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<CommandResponse> {
    const response = await this.raw.command(request, token, options);
    const body = await readRecord(response, this.#attempt(response, options));
    const error = body["error"];

    if (typeof error === "number" && error !== NO_ERROR && error !== COMMAND_NOTHING_CHANGED) {
      throw new CommandError(error, response);
    }

    return body as unknown as CommandResponse;
  }

  /**
   * Runs a document builder script with `/docbuilder`. The document server downloads it from
   * `request.url`. To collect an `async` build, send `{ async: true, key }` instead.
   *
   * @example
   * ```ts
   * const { urls } = await client.docbuilder({ url: "https://example.com/contract.js" });
   * ```
   *
   * @param request The script URL and its `argument`, or the key of a build to collect.
   * @param token A token for the authorization header, from
   * {@link jwt!DocumentServerJwt.signHeader | DocumentServerJwt.signHeader()}. Without it, no
   * authorization header is sent: for a server without a JWT secret, or with the token in
   * `request.token`.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns `urls`, the files the script saved, once `end` is `true`, or the `key` of the
   * build and `end: false` while an `async` build runs.
   * @throws {@link BuilderError} when the body has an `error` code other than `0`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range.
   * @throws {@link DocumentServerParseError} when the body is not a JSON object.
   * @see [Document builder](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/document-builder.md)
   */
  async docbuilder(
    request: BuilderRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<BuilderResponse> {
    return await this.#build(await this.raw.docbuilder(request, token, options), options);
  }

  /**
   * Runs a document builder script sent in the request, with `/docbuilder/from-file`.
   *
   * The request is `multipart/form-data`: `request` as JSON in a `params` part, then the
   * script as `file`, named after the `File`, or `script.docbuilder` for a `Blob` without a
   * name. Collect an `async` build with `docbuilder({ async: true, key })`, which doesn't
   * upload the script again.
   *
   * A token, in the header or in `request.token`, must carry `operation: "docbuilder"`.
   *
   * @param request The `argument` of the script, `async` and `token`. No `key`: the service
   * creates one.
   * @param file The script.
   * @param token A token for the authorization header, from
   * {@link jwt!DocumentServerJwt.signHeader | DocumentServerJwt.signHeader()}. Without it, no
   * authorization header is sent: for a server without a JWT secret, or with the token in
   * `request.token`.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns What {@link DocumentServerClient.docbuilder} returns.
   * @throws {@link BuilderError} when the body has an `error` code other than `0`.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range, `404`
   * included for a document server without this endpoint.
   * @throws {@link DocumentServerParseError} when the body is not a JSON object.
   * @see [Upload the script in the request](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/document-builder.md#upload-the-script-in-the-request)
   */
  async docbuilderFromFile(
    request: BuildFileRequest,
    file: Blob,
    token?: string,
    options?: RequestOptions,
  ): Promise<BuilderResponse> {
    return await this.#build(
      await this.raw.docbuilderFromFile(request, file, token, options),
      options,
    );
  }

  async #build(response: Response, options?: RequestOptions): Promise<BuilderResponse> {
    const body = await readRecord(response, this.#attempt(response, options));
    const error = body["error"];

    if (typeof error === "number" && error !== NO_ERROR) {
      throw new BuilderError(error, response);
    }

    return body;
  }

  /**
   * Downloads a file the document server keeps: a conversion result, a forgotten document, a
   * saved document. Split the URL the server handed out with {@link splitFileUrl} first.
   *
   * Sends no token: the URL is signed by the document server itself. `timeoutMs` covers the
   * wait for the response and stops once it arrives, so the body can be read for as long as
   * it takes. To cancel a download in progress, pass a `signal`.
   *
   * @example
   * ```ts
   * const { path, query } = splitFileUrl(result.fileUrl, "https://docs.example.com");
   * const file = await client.getFile(path, query);
   *
   * await pipeline(Readable.fromWeb(file.body), createWriteStream("output.pdf"));
   * ```
   *
   * @param path The path of the file, relative to `baseUrl`.
   * @param query The query the document server signed the URL with.
   * @param options Overrides for this call: a `signal`, a `timeoutMs` and `headers`.
   * @returns The response, with the body unread, so a large file can be streamed.
   * @throws {@link DocumentServerHttpError} when the status is outside the 2xx range, before
   * the body is handed over.
   * @see [Downloading files](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/files.md)
   */
  async getFile(
    path: string,
    query?: Readonly<Record<string, string>>,
    options?: RequestOptions,
  ): Promise<Response> {
    const response = await this.raw.getFile(path, query, options);

    if (!response.ok) {
      throw new DocumentServerHttpError(response, await readSnippet(response));
    }

    return response;
  }
}
