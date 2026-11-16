# Caching the server configuration

- [Set up the caches](#set-up-the-caches)
- [Reading from the cache](#reading-from-the-cache)
- [When the server is down](#when-the-server-is-down)
- [Options](#options)
- [Serverless runtimes](#serverless-runtimes)

## Set up the caches

```ts
import {
  DocumentServerClient,
  DocumentServerFormats,
  DocumentServerMetaCache,
} from "@onlyoffice/docs-integration-sdk";

const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });

const config = new DocumentServerMetaCache({
  getData: (signal) => client.getConfig({ signal }),
});

const formats = new DocumentServerMetaCache({
  getData: async (signal) => new DocumentServerFormats(await client.getFormats({ signal })),
});
```

[`getConfig()` and `getFormats()`](formats.md) describe the document server, and that changes
only with its version or its address. A `DocumentServerMetaCache` keeps one such answer in memory
for a day, so a request to your application doesn't cost one to the document server. Create one
cache per answer.

A cache sends no request until the first `get()`. It holds what `getData` resolved to, so
`getData` can build what your application needs once per load, such as a ready
`DocumentServerFormats` instead of the raw list.

## Reading from the cache

```ts
app.get("/editor", async (req, res) => {
  const list = await formats.get();

  if (list === null) {
    res.status(503).send("The document server is not available yet");
    return;
  }

  const documentType = list.getDocumentType(String(req.query.file));
  // …
});
```

`get()` resolves to what is cached, or to `null` while nothing has loaded. Handle `null`, for
example by answering with an error: the document server may not have answered yet, or may be
down.

One load runs at a time. When the data is older than `ttlMs`, or there is none, the call to
`get()` that notices it starts a load and waits for it, resolving to the new data. The calls made
while that load runs don't wait: they resolve at once to the old data, or to `null` when the
cache is still empty, as for the requests that come in together right after start.

Every call to `get()` gets the same object, so a change to it is seen by every other request.
Don't write to it: build what you need, such as a list of languages, from a copy, or freeze the
data in `getData`.

## When the server is down

```ts
const config = new DocumentServerMetaCache({
  getData: (signal) => client.getConfig({ signal }),
  onError: (error) => logger.warn("document server config", error),
});
```

A failed load keeps the old data, if there is any, and calls `onError` with the error of
`getData`. The errors are the ones the client throws, unchanged:
see [Errors](errors.md).

A call that waited for a failed load resolves to the old data too; `get()` never rejects. After a
failure, `get()` starts no load for `retryMs`, a minute by default, so a server that is down isn't
asked on every request.

A load that hasn't ended within `loadTimeoutMs`, a minute by default, counts as failed: the
signal passed to `getData` is aborted, `onError` gets a `DOMException` named `"TimeoutError"`,
the call that waits for the load resolves to the old data, and what the load ends with later is
ignored. Pass the signal on, as in the examples above, so that the request of such a load is
cancelled too.

## Options

| Option          | Default           | What it does                                        |
| --------------- | ----------------- | --------------------------------------------------- |
| `getData`       | required          | loads the data                                      |
| `ttlMs`         | `86400000`, a day | how long loaded data is fresh                       |
| `retryMs`       | `60000`, a minute | how long to wait after a failed load before another |
| `loadTimeoutMs` | `60000`, a minute | how long a load may run before it counts as failed  |
| `onError`       | none              | gets the error of a failed load                     |

Each process keeps its own data, and loads start only from `get()`.

## Serverless runtimes

A runtime that freezes or stops a function once its response is sent, such as AWS Lambda or
Cloudflare Workers, may never finish work left running after the response. Every load is
started and awaited by a call to `get()`, so it ends within the request that made that call, and
the cache can be created at the top of the module.
