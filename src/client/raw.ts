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

import type { BuildFileRequest, BuilderRequest } from "./builder.js";
import type { CommandRequest } from "./command.js";
import type { ConvertFileRequest, ConvertRequest } from "./convert.js";
import type { ClientOptions, RequestOptions } from "./options.js";
import { transportError } from "./transport.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";

interface RequestSpec {
  method: "GET" | "POST";
  query?: Readonly<Record<string, string>>;
  json?: unknown;
  form?: FormData;
  token?: string;
  stream?: boolean;
}

function buildUrl(baseUrl: string, path: string, query?: Readonly<Record<string, string>>): string {
  const url = baseUrl + "/" + path.replace(/^\/+/, "");
  const entries = Object.entries(query ?? {});

  if (entries.length === 0) {
    return url;
  }

  const search = entries
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .join("&");

  return `${url}${url.includes("?") ? "&" : "?"}${search}`;
}

function buildForm(request: object, file: Blob, filename: string): FormData {
  const form = new FormData();

  form.append("params", JSON.stringify(request));
  form.append("file", file, filename);

  return form;
}

function fileName(file: Blob, fallback: string): string {
  const name = "name" in file ? file.name : undefined;

  return typeof name === "string" && name !== "" ? name : fallback;
}

function normalizeBaseUrl(baseUrl: string): string {
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError(`baseUrl must be an absolute URL, got: ${baseUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`baseUrl must use http or https, got: ${url.protocol}`);
  }

  url.search = "";
  url.hash = "";

  return url.href.replace(/\/+$/, "");
}

function mergeHeaders(
  base: Headers | Readonly<Record<string, string>>,
  overrides?: Readonly<Record<string, string>>,
): Headers {
  const headers = new Headers(base);

  for (const [name, value] of Object.entries(overrides ?? {})) {
    headers.set(name, value);
  }

  return headers;
}

function normalizeTimeout(timeoutMs: number): number {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new TypeError(
      `timeoutMs must be an integer from 1 to ${String(MAX_TIMEOUT_MS)}, got: ${String(timeoutMs)}`,
    );
  }

  return timeoutMs;
}

function buildSignal(timeoutMs: number, options?: RequestOptions): AbortSignal {
  const timeout = AbortSignal.timeout(normalizeTimeout(options?.timeoutMs ?? timeoutMs));

  return options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
}

interface Deadline {
  signal: AbortSignal;
  disarm: () => void;
}

function buildDeadline(timeoutMs: number, options?: RequestOptions): Deadline {
  const controller = new AbortController();
  const timer = setTimeout(
    () => {
      controller.abort(
        new DOMException("The operation was aborted due to timeout", "TimeoutError"),
      );
    },
    normalizeTimeout(options?.timeoutMs ?? timeoutMs),
  );

  return {
    signal: options?.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal,
    disarm: () => {
      clearTimeout(timer);
    },
  };
}

/**
 * The same endpoints as {@link DocumentServerClient}, returning the untouched `Response`. It
 * never rejects on what the document server answers, only when no answer comes: with
 * {@link DocumentServerNetworkError}, with {@link DocumentServerTimeoutError}, or with the
 * reason of your `signal` when you cancel the call.
 *
 * Every request gets, in this order, each over the one before:
 *
 * 1. the configured `headers`;
 * 2. the headers the endpoint needs: `content-type` and `accept` set to `application/json`
 *    for a JSON body, no `content-type` for a form, whose boundary `fetch` writes, and the
 *    authorization header when a token is given;
 * 3. the `headers` of the call. Names are matched in any case.
 *
 * The deadline is `timeoutMs`, of the call or of the client. It covers the whole exchange,
 * except for {@link DocumentServerRawClient.getFile} and
 * {@link DocumentServerRawClient.convertFromFile}, where it stops once the response arrives.
 *
 * @see [The raw client](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/client.md#the-raw-client)
 */
export class DocumentServerRawClient {
  /** The settings in effect: validated, with defaults, and frozen. */
  readonly options: Readonly<Required<ClientOptions>>;

  /**
   * @param options The address of the document server, and the defaults of every request.
   * @throws {TypeError} when `baseUrl` is not an absolute `http` or `https` URL, or
   * `timeoutMs` is not a whole number from `1` to `2147483647`.
   */
  constructor(options: ClientOptions) {
    this.options = Object.freeze({
      baseUrl: normalizeBaseUrl(options.baseUrl),
      timeoutMs: normalizeTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      headers: Object.freeze({ ...options.headers }),
      authorizationHeader: options.authorizationHeader ?? DEFAULT_AUTHORIZATION_HEADER,
      authorizationPrefix: options.authorizationPrefix ?? DEFAULT_AUTHORIZATION_PREFIX,
      fetch: options.fetch ?? ((url, init) => globalThis.fetch(url, init)),
    });
  }

  async #request(path: string, spec: RequestSpec, options?: RequestOptions): Promise<Response> {
    const headers = new Headers(this.options.headers);

    if (spec.json !== undefined) {
      headers.set("content-type", "application/json");
      headers.set("accept", "application/json");
    }

    if (spec.form !== undefined) {
      headers.delete("content-type");
    }

    if (spec.token !== undefined) {
      const { authorizationHeader, authorizationPrefix } = this.options;

      headers.set(authorizationHeader, `${authorizationPrefix}${spec.token}`);
    }

    const url = buildUrl(this.options.baseUrl, path, spec.query);
    const init: RequestInit = {
      method: spec.method,
      headers: mergeHeaders(headers, options?.headers),
      body: spec.form ?? (spec.json === undefined ? undefined : JSON.stringify(spec.json)),
    };
    const deadline = spec.stream ? buildDeadline(this.options.timeoutMs, options) : undefined;

    init.signal = deadline?.signal ?? buildSignal(this.options.timeoutMs, options);

    try {
      return await this.options.fetch(url, init);
    } catch (error) {
      throw transportError(error, {
        url,
        timeoutMs: options?.timeoutMs ?? this.options.timeoutMs,
        signal: options?.signal,
      });
    } finally {
      deadline?.disarm();
    }
  }

  /** Gets `/healthcheck`, whose body is `true` when the server is up. */
  async healthcheck(options?: RequestOptions): Promise<Response> {
    return await this.#request("/healthcheck", { method: "GET" }, options);
  }

  /** Gets `/meta/config`, where the document server describes itself. */
  async getConfig(options?: RequestOptions): Promise<Response> {
    return await this.#request("/meta/config", { method: "GET" }, options);
  }

  /** Gets `/meta/formats`, the file formats the document server knows. */
  async getFormats(options?: RequestOptions): Promise<Response> {
    return await this.#request("/meta/formats", { method: "GET" }, options);
  }

  /** Posts `request` as JSON to `/converter`, with its `key` as the `shardkey` query parameter. */
  async convert(
    request: ConvertRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    return await this.#request(
      "/converter",
      { method: "POST", query: { shardkey: request.key }, json: request, token },
      options,
    );
  }

  /**
   * Posts `request` and the document as `multipart/form-data` to `/converter/from-file`, with
   * its `key`, when given, as the `shardkey` query parameter. On a 2xx the body is the
   * converted file, or JSON while an `async` conversion runs.
   */
  async convertFromFile(
    request: ConvertFileRequest,
    file: Blob,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    const query = request.key === undefined ? undefined : { shardkey: request.key };

    return await this.#request(
      "/converter/from-file",
      {
        method: "POST",
        query,
        form: buildForm(request, file, fileName(file, `document.${request.filetype}`)),
        token,
        stream: true,
      },
      options,
    );
  }

  /**
   * Posts `request` as JSON to `/command`, with its `key` as the `shardkey` query parameter.
   * `getForgottenList`, `license` and `version` have no key and are sent without it.
   */
  async command(
    request: CommandRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    const query = "key" in request ? { shardkey: request.key } : undefined;

    return await this.#request(
      "/command",
      { method: "POST", query, json: request, token },
      options,
    );
  }

  /**
   * Posts `request` as JSON to `/docbuilder`, with its `key`, when given, as the `shardkey`
   * query parameter.
   */
  async docbuilder(
    request: BuilderRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    const query = request.key === undefined ? undefined : { shardkey: request.key };

    return await this.#request(
      "/docbuilder",
      { method: "POST", query, json: request, token },
      options,
    );
  }

  /**
   * Posts `request` and the script as `multipart/form-data` to `/docbuilder/from-file`,
   * without a `shardkey`: the service creates the key.
   */
  async docbuilderFromFile(
    request: BuildFileRequest,
    file: Blob,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    return await this.#request(
      "/docbuilder/from-file",
      {
        method: "POST",
        form: buildForm(request, file, fileName(file, "script.docbuilder")),
        token,
      },
      options,
    );
  }

  /**
   * Gets a file the document server keeps, by the path and the query
   * {@link splitFileUrl} returns. Sends no token. On a 2xx the body is the file, unread.
   */
  async getFile(
    path: string,
    query?: Readonly<Record<string, string>>,
    options?: RequestOptions,
  ): Promise<Response> {
    return await this.#request(path, { method: "GET", query, stream: true }, options);
  }
}
