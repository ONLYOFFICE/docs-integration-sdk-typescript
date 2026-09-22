import type { BuilderRequest } from "./builder.js";
import type { CommandRequest } from "./command.js";
import type { ConvertRequest } from "./convert.js";
import type { ClientOptions, RequestOptions } from "./options.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";

interface RequestSpec {
  method: "GET" | "POST";
  query?: Readonly<Record<string, string>>;
  json?: unknown;
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

  return `${url}?${search}`;
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

/** A deadline that can be called off once the response headers have arrived. */
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

export class DocumentServerClient {
  readonly options: Readonly<Required<ClientOptions>>;

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

    if (spec.token !== undefined) {
      const { authorizationHeader, authorizationPrefix } = this.options;

      headers.set(authorizationHeader, `${authorizationPrefix}${spec.token}`);
    }

    const deadline = spec.stream ? buildDeadline(this.options.timeoutMs, options) : undefined;

    try {
      return await this.options.fetch(buildUrl(this.options.baseUrl, path, spec.query), {
        method: spec.method,
        headers: mergeHeaders(headers, options?.headers),
        body: spec.json === undefined ? undefined : JSON.stringify(spec.json),
        signal: deadline?.signal ?? buildSignal(this.options.timeoutMs, options),
      });
    } finally {
      deadline?.disarm();
    }
  }

  async healthcheck(options?: RequestOptions): Promise<Response> {
    return await this.#request("/healthcheck", { method: "GET" }, options);
  }

  async getConfig(options?: RequestOptions): Promise<Response> {
    return await this.#request("/meta/config", { method: "GET" }, options);
  }

  async getFormats(options?: RequestOptions): Promise<Response> {
    return await this.#request("/meta/formats", { method: "GET" }, options);
  }

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

  async getFile(
    path: string,
    query?: Readonly<Record<string, string>>,
    options?: RequestOptions,
  ): Promise<Response> {
    return await this.#request(path, { method: "GET", query, stream: true }, options);
  }
}
