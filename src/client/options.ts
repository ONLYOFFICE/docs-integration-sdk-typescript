export interface ClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  authorizationHeader?: string;
  authorizationPrefix?: string;
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
