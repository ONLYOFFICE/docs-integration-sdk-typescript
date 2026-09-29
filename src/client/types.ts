export interface ClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}
