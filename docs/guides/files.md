# Downloading files

`getFile()` downloads a file stored by the document server: a conversion result, a forgotten
document, a saved document and the changes that come with a callback.

```ts
const file = await client.getFile("/cache/files/data/conv_key/output.pdf/output.pdf", {
  md5: "Zm9vYmFy",
  expires: "1735689600",
  filename: "output.pdf",
});

const bytes = new Uint8Array(await file.arrayBuffer());
```

It takes a path and a query, not a URL, and sends them to the configured `baseUrl`.

- [Split the URL first](#split-the-url-first)
- [Tokens](#tokens)
- [Streaming](#streaming)
- [Timeout](#timeout)

## Split the URL first

The document server hands out absolute URLs: `fileUrl` of a conversion, `url` of a callback,
`url` of `getForgotten`. Split such a URL with `splitFileUrl()` before you pass it on. The second
argument is the public address of the document server, the one editors load `api.js` from:

```ts
import { splitFileUrl } from "@onlyoffice/docs-integration-sdk";

const { path, query } = splitFileUrl(result.fileUrl, "https://docs.example.com/office");

await client.getFile(path, query);
```

**Why split.** The URLs point to the public address, path included. Your integration may reach
the document server at another host and path:

```ts
const client = new DocumentServerClient({ baseUrl: "https://192.168.6.10/some-path" });

// url: https://my-doc-server.com/some-path/office/cache/files/…
const { path, query } = splitFileUrl(url, "https://my-doc-server.com/some-path/office");

await client.getFile(path, query); // https://192.168.6.10/some-path/cache/files/…
```

`splitFileUrl()` removes the path of the public address from the front and drops the host. You
keep only the path and the query, and the host is the one you configured.

A URL outside the public address is kept whole. For example, the default Docker setup answers
with `http://localhost/cache/files/…`: the integration can't reach that host, but the path is
correct.

## Tokens

`getFile()` sends no token and no authorization header. These URLs are signed by the document
server itself and carry their expiry in the query.

## Streaming

The configured `headers` and `fetch` apply as usual. The `Response` is returned unread, so you
can stream a large file instead of buffering it:

```ts
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

if (file.body !== null) {
  await pipeline(Readable.fromWeb(file.body), createWriteStream("output.pdf"));
}
```

A status outside 2xx rejects with a `DocumentServerHttpError` before you get the body. So an
error page from a reverse proxy is never written to disk as the file.

## Timeout

`timeoutMs` only limits the wait for the response. It stops once the response arrives, so
reading the body doesn't race the deadline. The beginning of an error body, read for the
`DocumentServerHttpError`, gets a `timeoutMs` of its own. To cancel a download in progress,
pass a `signal`.
See [`timeoutMs`](client.md#timeoutms).
