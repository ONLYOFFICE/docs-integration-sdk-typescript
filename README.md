# @onlyoffice/docs-integration-sdk

TypeScript SDK for integrating ONLYOFFICE Docs editors.

Built on the standard `fetch` — no HTTP dependencies, works in Node.js 20+, Deno, Bun,
browsers and edge runtimes. Ships both ESM and CJS builds with bundled type definitions.

Early stage: the client currently covers the health check and the conversion API.

## Installation

```sh
npm install @onlyoffice/docs-integration-sdk
```

## Usage

```ts
import { DocumentServerClient } from "@onlyoffice/docs-integration-sdk";

const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  timeoutMs: 5_000,
  headers: { "x-request-source": "my-app" },
});

const response = await client.healthcheck();
const healthy = response.ok && (await response.text()).trim() === "true";
```

Every method returns the raw `Response`, so the caller decides what a failure means.
Check `response.ok` and read the body — an unread body keeps the connection open.

## Conversion

`convert()` posts to `/converter`, the [conversion API][conversion-api] of the document
server, which downloads the source document from `url` and converts it:

```ts
const response = await client.convert({
  filetype: "docx",
  key: "Khirz6zTPdfd7",
  outputtype: "pdf",
  title: "Contract.docx",
  url: "https://example.com/contract.docx",
});

const result = (await response.json()) as ConvertResponse;

if (result.error !== undefined) {
  throw new Error(`conversion failed with code ${result.error}`);
}

result.fileUrl; // https://docs.example.com/cache/files/…/output.pdf
```

The service answers `200 OK` whether the conversion succeeded or failed, so `response.ok`
proves nothing: the body either carries `fileUrl` and `endConvert`, or an `error` code
from `-1` to `-10` — `-5` incorrect password, `-8` invalid token, and so on. The codes are
listed on `ConversionErrorCode`.

The request accepts every parameter the API documents — `thumbnail` for an image output,
`spreadsheetLayout` for a spreadsheet printed to PDF, `pdf.form` for a fillable form,
`watermark`, `documentLayout`, `documentRenderer`, `password`, `region`, `delimiter` and
`codePage` — each typed and documented on `ConvertRequest`:

```ts
await client.convert({
  filetype: "xlsx",
  key: "Khirz6zTPdfd7",
  outputtype: "pdf",
  url: "https://example.com/report.xlsx",
  region: "de-DE",
  spreadsheetLayout: {
    orientation: "landscape",
    fitToWidth: 1,
    gridLines: true,
    margins: { left: "10mm", right: "10mm", top: "10mm", bottom: "10mm" },
  },
});
```

`Accept: application/json` is sent for you; without it the service replies in XML. A
`content-type` among the configured `headers` is overridden rather than merged with, so a
stray value cannot corrupt the request.

### Synchronous and asynchronous conversion

By default the document server holds the connection open until the file is ready. A large
document can outlast `timeoutMs` — and the reverse proxy in front of the server has a
deadline of its own. `async: true` returns immediately with `endConvert: false` and a
`percent`; repeat the very same request, unchanged, until `endConvert` turns `true`:

```ts
const request: ConvertRequest = { async: true, filetype: "docx", key, outputtype: "pdf", url };

for (;;) {
  const result = (await (await client.convert(request)).json()) as ConvertResponse;

  if (result.error !== undefined) throw new Error(`conversion failed: ${result.error}`);
  if (result.endConvert) break;

  await new Promise((resolve) => setTimeout(resolve, 1000));
}
```

The `key` identifies the source document: reusing it returns the cached result, so a new
version of the same file needs a new key.

### Signing and cluster routing

When the document server is configured with a secret, the request has to carry a JWT — and
it takes one in either of two places, signed over two different payloads. In the body,
`token` signs the body itself; in a header, the signature covers the body wrapped as
`{ payload: … }`. The SDK ships no JWT implementation, so use the library you already have:

```ts
// In the body, as a field of the request.
await client.convert({ ...request, token: jwt.sign(request, secret) });

// In a header, as the second argument.
await client.convert(request, jwt.sign({ payload: request }, secret));
```

Sending both is fine as long as each was signed over its own payload — handing the same
token to both places fails with `-8`. Omit the second argument and no header is sent at
all, which is what a server without a secret wants.

On a document server cluster the request is pinned to one node by a `shardkey` query
parameter carrying the document key, which keeps every call about one document on the
same node. Being a query parameter rather than a body field, it stays out of both signed
payloads. Sent always; versions before Docs 8.1 ignore it.

[conversion-api]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/

## Options

| Option                | Default            | Description                                             |
| --------------------- | ------------------ | ------------------------------------------------------- |
| `baseUrl`             | —                  | Base URL of the document server. Required.              |
| `timeoutMs`           | `30000`            | Request timeout.                                        |
| `headers`             | `{}`               | Headers sent with every request.                        |
| `authorizationHeader` | `"Authorization"`  | Header a conversion token is sent in.                   |
| `authorizationPrefix` | `"Bearer "`        | Put before the token in that header.                    |
| `fetch`               | `globalThis.fetch` | Custom `fetch`: proxy, mTLS, retries, logging, mocking. |

`client.options` holds the effective settings — validated, with defaults applied, and
frozen. It is a copy, so changing the object you passed in has no effect afterwards:

```ts
client.options;
// { baseUrl: "https://docs.example.com", timeoutMs: 5000, headers: {…},
//   authorizationHeader: "Authorization", authorizationPrefix: "Bearer ", fetch: ƒ }
```

### baseUrl

The base URL is validated once, in the constructor, and stored in canonical form:
surrounding whitespace, a trailing slash, a query and a fragment are dropped, and the
host is lowercased. A path prefix is preserved, so a document server behind
`https://example.com/office/` keeps working.

An invalid value throws a `TypeError` immediately rather than failing later at request
time. Note that the URL parser accepts any scheme, so the protocol is checked separately:
`htp://host` is a valid URL but not a usable base URL.

```ts
new DocumentServerClient({ baseUrl: "docs.example.com" });
// TypeError: baseUrl must be an absolute URL, got: docs.example.com

new DocumentServerClient({ baseUrl: "htp://docs.example.com" });
// TypeError: baseUrl must use http or https, got: htp:
```

### timeoutMs

Neither the fetch standard nor Node gives a request deadline: undici only aborts a
connection that never opens (~10 s) or a response that stays silent for 5 minutes, so a
hung server would otherwise hold the call indefinitely. Hence the 30 s default.

A request that runs out of time rejects with a `DOMException` whose `name` is
`"TimeoutError"`. A server that cannot be reached rejects with `TypeError: fetch failed`;
the reason is in `error.cause` — on Node an `AggregateError` carrying `code`, such as
`"ECONNREFUSED"`.

### authorizationHeader and authorizationPrefix

Both mirror the document server's own `token.outbox.header` and `token.outbox.prefix`
settings, and are read only when `convert()` is given a token. The prefix is joined to the
token as it stands, so the trailing space belongs to the default value and an empty string
leaves the token bare:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  authorizationHeader: "X-Docs-Token",
  authorizationPrefix: "",
});

await client.convert(request, token); // X-Docs-Token: <token>
```

A same-named header among the configured `headers` is left alone until a token is passed,
and is then overridden rather than merged with.

### fetch

Supplying your own `fetch` is the extension point for everything the SDK does not do
itself — a proxy or mTLS agent, retries, logging, tracing, request mocking:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  fetch: (url, init) => {
    console.log("->", url);
    return fetch(url, init);
  },
});
```

When the option is omitted, the global `fetch` is looked up on each call rather than
captured at construction, so a `fetch` patched later — by msw or an instrumentation
agent — is still picked up.

## Per-request options

Both `healthcheck()` and `convert()` take a last, optional argument that overrides the
client settings for that one call:

```ts
await client.convert(request, token, {
  signal: controller.signal,
  timeoutMs: 120_000,
  headers: { "x-request-id": requestId },
});
```

| Option      | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `signal`    | Cancels the call. The deadline still applies alongside it.                   |
| `timeoutMs` | Deadline for this call, in place of the configured one.                      |
| `headers`   | Headers laid over the configured ones. Names are matched case-insensitively. |

`signal` is joined with the deadline through `AbortSignal.any()`, so whichever fires first
aborts the request: a cancelled call rejects with the reason the signal carries, a call
that runs out of time with a `"TimeoutError"`. Passing a signal therefore does not disarm
the timeout — pass a larger `timeoutMs` for a conversion expected to be slow.

The headers are applied last, over the configured ones and over the `content-type`,
`accept` and authorization headers `convert()` sets itself. Since the match ignores case,
`{ "X-Tenant": "globex" }` replaces a configured `x-tenant` rather than adding a second
copy of it.

## Project layout

```
src/
  index.ts            public exports
  client/index.ts     DocumentServerClient
  client/options.ts   ClientOptions and RequestOptions
  client/convert.ts   conversion request and response
test/
  client.test.ts
```

## Development

```sh
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run lint        # eslint
npm run format      # prettier --write
npm run build       # tsup -> dist (ESM + CJS + .d.ts)
```
