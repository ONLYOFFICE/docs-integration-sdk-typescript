import type { ConvertRequest } from "./convert.js";
import type { ClientOptions } from "./options.js";

const DEFAULT_TIMEOUT_MS = 30_000;

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

export class DocumentServerClient {
  readonly options: Readonly<Required<ClientOptions>>;

  constructor(options: ClientOptions) {
    this.options = Object.freeze({
      baseUrl: normalizeBaseUrl(options.baseUrl),
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      headers: Object.freeze({ ...options.headers }),
      fetch: options.fetch ?? ((url, init) => globalThis.fetch(url, init)),
    });
  }

  async healthcheck(): Promise<Response> {
    return await this.options.fetch(buildUrl(this.options.baseUrl, "/healthcheck"), {
      method: "GET",
      headers: this.options.headers,
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });
  }

  async convert(request: ConvertRequest): Promise<Response> {
    const headers = new Headers(this.options.headers);

    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    const query = `?shardkey=${encodeURIComponent(request.key)}`;

    return await this.options.fetch(buildUrl(this.options.baseUrl, `/converter${query}`), {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });
  }
}
