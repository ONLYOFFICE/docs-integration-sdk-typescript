import type { ConvertRequest } from "./convert.js";
import type { ClientOptions, RequestOptions } from "./options.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";

function buildUrl(baseUrl: string, path: string): string {
  return baseUrl + "/" + path.replace(/^\/+/, "");
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

/** Aborts on the caller's signal, on the deadline, or on whichever comes first. */
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

  async healthcheck(options?: RequestOptions): Promise<Response> {
    return await this.options.fetch(buildUrl(this.options.baseUrl, "/healthcheck"), {
      method: "GET",
      headers: mergeHeaders(this.options.headers, options?.headers),
      signal: buildSignal(this.options.timeoutMs, options),
    });
  }

  async convert(
    request: ConvertRequest,
    token?: string,
    options?: RequestOptions,
  ): Promise<Response> {
    const headers = new Headers(this.options.headers);

    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    if (token !== undefined) {
      headers.set(this.options.authorizationHeader, `${this.options.authorizationPrefix}${token}`);
    }

    const query = `?shardkey=${encodeURIComponent(request.key)}`;

    return await this.options.fetch(buildUrl(this.options.baseUrl, `/converter${query}`), {
      method: "POST",
      headers: mergeHeaders(headers, options?.headers),
      body: JSON.stringify(request),
      signal: buildSignal(this.options.timeoutMs, options),
    });
  }
}
