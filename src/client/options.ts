export interface ClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  authorizationHeader?: string;
  authorizationPrefix?: string;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}
