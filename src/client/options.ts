/** Settings of a client, applied to every request it sends. */
export interface ClientOptions {
  /** Base URL of the document server, such as `"https://docs.example.com"`. Required. */
  baseUrl: string;
  /** Deadline for a request, in whole milliseconds from `1` to `2147483647`. Default: `30000`. */
  timeoutMs?: number;
  /** Headers sent with every request. */
  headers?: Record<string, string>;
  /** Header a token is sent in. Default: `"Authorization"`. */
  authorizationHeader?: string;
  /** Written before the token in that header. Default: `"Bearer "`. */
  authorizationPrefix?: string;
  /**
   * A `fetch` of your own: a proxy, mTLS, retries, logging, mocking. Default: the global
   * `fetch`, looked up on each call rather than captured at construction.
   */
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}

/** Overrides applied to a single request, on top of the client options. */
export interface RequestOptions {
  /** Aborts the request. The configured timeout still applies alongside it. */
  signal?: AbortSignal;
  /** Deadline for this request, in place of the configured one. */
  timeoutMs?: number;
  /** Headers laid over the configured ones. Names are matched case-insensitively. */
  headers?: Readonly<Record<string, string>>;
}
