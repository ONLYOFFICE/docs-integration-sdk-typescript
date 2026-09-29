# @onlyoffice/docs-integration-sdk

TypeScript SDK for integrating ONLYOFFICE Docs editors.

Built on the standard `fetch` — no HTTP dependencies, works in Node.js 20+, Deno, Bun,
browsers and edge runtimes. Ships both ESM and CJS builds with bundled type definitions.

Early stage: the client currently covers the document server health check.

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

`healthcheck()` returns the raw `Response`, so the caller decides what a failure means.
Check `response.ok` and read the body — an unread body keeps the connection open.

## Options

| Option      | Default            | Description                                             |
| ----------- | ------------------ | ------------------------------------------------------- |
| `baseUrl`   | —                  | Base URL of the document server. Required.              |
| `timeoutMs` | `30000`            | Request timeout.                                        |
| `headers`   | `{}`               | Headers sent with every request.                        |
| `fetch`     | `globalThis.fetch` | Custom `fetch`: proxy, mTLS, retries, logging, mocking. |

`client.options` holds the effective settings — validated, with defaults applied, and
frozen. It is a copy, so changing the object you passed in has no effect afterwards:

```ts
client.options; // { baseUrl: "https://docs.example.com", timeoutMs: 5000, headers: {…}, fetch: ƒ }
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

## Project layout

```
src/
  index.ts          public exports
  client/index.ts   DocumentServerClient
  client/types.ts   ClientOptions
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
