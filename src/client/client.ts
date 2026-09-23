import type { BuilderRequest, BuilderResponse } from "./builder.js";
import type { CommandErrorCode, CommandRequest, CommandResponse } from "./command.js";
import type { ConvertRequest, ConvertResponse } from "./convert.js";
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
 * The document server endpoints, each parsing the answer into the type its endpoint
 * promises and rejecting when the server reports a failure — in the status, or, the way
 * the conversion, command and builder services do, in a body it answered `200 OK` with.
 */
export class DocumentServerClient {
  /** The same endpoints, answering with the untouched `Response`. */
  readonly raw: DocumentServerRawClient;

  constructor(options: ClientOptions) {
    this.raw = new DocumentServerRawClient(options);
  }

  /** The effective settings: validated, with the defaults applied, and frozen. */
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

  /** Whether the document server is up. A failing status is an answer, not a rejection. */
  async healthcheck(options?: RequestOptions): Promise<boolean> {
    const response = await this.raw.healthcheck(options);

    if (!response.ok) {
      await readSnippet(response);

      return false;
    }

    return (await readText(response, this.#attempt(response, options))).trim() === "true";
  }

  /**
   * How the document server describes itself: the header it expects a token in, the paths
   * of its endpoints, the largest file it accepts and the languages of its editor.
   */
  async getConfig(options?: RequestOptions): Promise<ConfigResponse> {
    const response = await this.raw.getConfig(options);

    return (await readRecord(
      response,
      this.#attempt(response, options),
    )) as unknown as ConfigResponse;
  }

  /** Every file format the document server knows, and what it may be converted to. */
  async getFormats(options?: RequestOptions): Promise<FormatsResponse> {
    const response = await this.raw.getFormats(options);

    return (await readArray(response, this.#attempt(response, options))) as FormatsResponse;
  }

  /**
   * Converts the document the server downloads from `url`.
   *
   * @throws {@link ConversionError} when the service answers with an `error` code.
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
   * Runs a command of the command service against a document the editors have open.
   *
   * @throws {@link CommandError} when the service answers with an `error` code other
   * than `4`, which reports that nothing had changed rather than a failure.
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
   * Runs the builder script the server downloads from `url`.
   *
   * @throws {@link BuilderError} when the service answers with an `error` code.
   */
  async docbuilder(
    request: BuilderRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<BuilderResponse> {
    const response = await this.raw.docbuilder(request, token, options);
    const body = await readRecord(response, this.#attempt(response, options));
    const error = body["error"];

    if (typeof error === "number" && error !== NO_ERROR) {
      throw new BuilderError(error, response);
    }

    return body;
  }

  /** The file itself, unread, so a large one can be streamed. */
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
