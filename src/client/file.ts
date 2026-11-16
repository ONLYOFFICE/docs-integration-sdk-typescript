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

/** The path and the query of a file, as {@link DocumentServerClient.getFile} takes them. */
export interface FileLocation {
  /** The path of the file, relative to the address the client reaches the server at. */
  path: string;
  /** The query the document server signed the URL with, such as `md5` and `expires`. */
  query: Record<string, string>;
}

function parseUrl(url: string | URL, name: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new TypeError(`${name} must be an absolute URL, got: ${String(url)}`);
  }
}

/**
 * Splits a file URL the document server handed out into the path and the query
 * {@link DocumentServerClient.getFile} takes. Such URLs are `url` of a callback, `fileUrl` of
 * a conversion and `url` of the `getForgotten` command.
 *
 * The URL points to the public address of the document server, while the client may reach it
 * at another host and path. So:
 *
 * - the host is dropped: the client sends the path to its own `baseUrl`;
 * - the path of `publicUrl` is removed from the front of the path. A path that doesn't start
 *   with it is kept whole, such as one under the `localhost` of a container.
 *
 * @example
 * ```ts
 * splitFileUrl(
 *   "https://docs.example.com/office/cache/files/key/output.pdf?md5=Zm9v&expires=1735689600",
 *   "https://docs.example.com/office",
 * );
 * // { path: "/cache/files/key/output.pdf", query: { md5: "Zm9v", expires: "1735689600" } }
 * ```
 *
 * @param fileUrl The URL the document server handed out.
 * @param publicUrl The public address of the document server, the one editors load `api.js`
 * from.
 * @throws {TypeError} when `fileUrl` or `publicUrl` is not an absolute URL.
 * @see [Downloading files](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/files.md)
 */
export function splitFileUrl(fileUrl: string | URL, publicUrl: string | URL): FileLocation {
  const location = parseUrl(fileUrl, "fileUrl");
  const prefix = parseUrl(publicUrl, "publicUrl").pathname.replace(/\/+$/, "");
  const { pathname } = location;
  const path =
    prefix !== "" && (pathname === prefix || pathname.startsWith(`${prefix}/`))
      ? pathname.slice(prefix.length) || "/"
      : pathname;

  return { path, query: Object.fromEntries(location.searchParams) };
}
