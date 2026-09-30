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

/** Settings of a client, applied to every request it sends. */
export interface ClientOptions {
  /**
   * The address of the document server, such as `"https://docs.example.com"`. Required. An
   * absolute `http` or `https` URL; a path prefix is kept, a trailing slash, a query and a
   * fragment are removed.
   */
  baseUrl: string;
  /**
   * The deadline of a request, in whole milliseconds from `1` to `2147483647`. A request that
   * runs out of time rejects with {@link DocumentServerTimeoutError}. Default: `30000`.
   */
  timeoutMs?: number;
  /** Headers sent with every request. */
  headers?: Record<string, string>;
  /**
   * The header a token is sent in, when a method gets one. Set it to
   * `authorization.header` of {@link DocumentServerClient.getConfig}. Default: `"Authorization"`.
   */
  authorizationHeader?: string;
  /**
   * What comes before the token in that header, as is: `""` sends a bare token. Set it to
   * `authorization.prefix` of {@link DocumentServerClient.getConfig}. Default: `"Bearer "`.
   */
  authorizationPrefix?: string;
  /**
   * A `fetch` of your own, for a proxy, mTLS, retries, logging or mocking. Default: the global
   * `fetch`, looked up on each call, so a `fetch` patched later is still used.
   */
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}

/** Overrides for one call, over the client options. */
export interface RequestOptions {
  /**
   * Cancels the call, which then rejects with the reason of the signal, unchanged. The
   * deadline still applies alongside it.
   */
  signal?: AbortSignal;
  /** The deadline of this call, instead of the configured one. Validated the same way. */
  timeoutMs?: number;
  /**
   * Headers laid over all others: the configured ones and those the SDK sets itself. Names are
   * matched in any case.
   */
  headers?: Readonly<Record<string, string>>;
}
