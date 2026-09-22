import type { BuilderRequest } from "./builder.js";
import type { CommandRequest } from "./command.js";
import type { ConvertRequest } from "./convert.js";
import type { ClientOptions, RequestOptions } from "./options.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";

interface RequestSpec {
  method: "GET" | "POST";
  query?: Readonly<Record<string, string>>;
  json?: unknown;
  token?: string;
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

function buildSignal(timeoutMs: number, options?: RequestOptions): AbortSignal {
  const timeout = AbortSignal.timeout(options?.timeoutMs ?? timeoutMs);

  return options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
}

export class DocumentServerClient {
  readonly options: Readonly<Required<ClientOptions>>;

  constructor(options: ClientOptions) {
    this.options = Object.freeze({
      baseUrl: normalizeBaseUrl(options.baseUrl),
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
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

    return await this.options.fetch(buildUrl(this.options.baseUrl, path, spec.query), {
      method: spec.method,
      headers: mergeHeaders(headers, options?.headers),
      body: spec.json === undefined ? undefined : JSON.stringify(spec.json),
      signal: buildSignal(this.options.timeoutMs, options),
    });
  }

  async healthcheck(options?: RequestOptions): Promise<Response> {
    return await this.#request("/healthcheck", { method: "GET" }, options);
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
}
