/** Path and query of a file the document server keeps, as `getFile()` takes them. */
export interface FileLocation {
  /** Path of the file, relative to the address the document server is reached at. */
  path: string;
  /** Query the document server signed the location with, such as `md5` and `expires`. */
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
 * Splits a location the document server handed out — `url` in a callback, `fileUrl` in a
 * conversion response, `url` in the answer to `getForgotten` — into the path and the query
 * {@link DocumentServerClient.getFile} takes.
 *
 * The document server writes these locations against the address it is published at,
 * `publicUrl`, while the client may reach it at another one, with another host and another
 * path. So the path of `publicUrl` is taken off the front of the location, and what is left
 * is relative to the server itself, whichever address the client is configured with. The
 * host of the location is dropped: it is the public one, or one only the server can reach,
 * such as the `localhost` of a container. A location whose path does not start with that of
 * `publicUrl` is kept whole.
 *
 * @throws {TypeError} when `fileUrl` or `publicUrl` is not an absolute URL.
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
