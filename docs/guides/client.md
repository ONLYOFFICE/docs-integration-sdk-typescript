# Client options

- [Create a client](#create-a-client)
- [Options](#options)
- [Per-request options](#per-request-options)
- [The raw client](#the-raw-client)

## Create a client

```ts
import { DocumentServerClient } from "@onlyoffice/docs-integration-sdk";

const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  timeoutMs: 5_000,
  headers: { "x-request-source": "my-app" },
});

const healthy = await client.healthcheck();
```

Every method parses the answer into the type its endpoint promises. It rejects when the document
server reports a failure, in the status or, for the conversion, command and builder services, in
a `200 OK` body. See [Errors](errors.md).

## Options

| Option                | Default            | Description                                             |
| --------------------- | ------------------ | ------------------------------------------------------- |
| `baseUrl`             | —                  | Base URL of the document server. Required.              |
| `timeoutMs`           | `30000`            | Request timeout.                                        |
| `headers`             | `{}`               | Headers sent with every request.                        |
| `authorizationHeader` | `"Authorization"`  | Header a token is sent in.                              |
| `authorizationPrefix` | `"Bearer "`        | Put before the token in that header.                    |
| `fetch`               | `globalThis.fetch` | Custom `fetch`: proxy, mTLS, retries, logging, mocking. |

`client.options` holds the effective settings: validated, with defaults, and frozen. It is a
copy, so changing the object you passed in has no effect:

```ts
client.options;
// { baseUrl: "https://docs.example.com", timeoutMs: 5000, headers: {…},
//   authorizationHeader: "Authorization", authorizationPrefix: "Bearer ", fetch: ƒ }
```

### baseUrl

Validated once, in the constructor, and stored in canonical form:

- whitespace around it, a trailing slash, a query and a fragment are removed;
- the host is lowercased;
- a path prefix is kept, so a server behind `https://example.com/office/` works.

An invalid value throws a `TypeError` right away, not at request time. The protocol is checked
separately, because the URL parser accepts any scheme:

```ts
new DocumentServerClient({ baseUrl: "docs.example.com" });
// TypeError: baseUrl must be an absolute URL, got: docs.example.com

new DocumentServerClient({ baseUrl: "htp://docs.example.com" });
// TypeError: baseUrl must use http or https, got: htp:
```

### timeoutMs

**Why a default.** Neither the fetch standard nor Node sets a request deadline. undici only
aborts a connection that never opens (about 10 s) or a response that is silent for 5 minutes. A
hung server would hold the call almost forever, hence the 30 s default.

**What it covers.** The deadline covers the whole exchange, including reading the body. That
fits endpoints with a small JSON answer. It doesn't fit `getFile()`, whose body can be of any
size: a slow download would fail halfway. So for `getFile()` and `convertFromFile()`, which answers
with the converted file, the deadline stops once the response arrives, and the body can take as long as it needs. What the typed client reads itself
still has a deadline: the beginning of an error body, and a JSON answer of `convertFromFile()`,
get a `timeoutMs` of their own once the response arrives. A `signal` of your own stays active
the whole time, and is the way to cancel a download. A download that stalls mid-body is not cut
short by the SDK: on Node undici ends it after 5 minutes of silence; elsewhere only a `signal`
does.

**Errors.** A request that runs out of time rejects with a `DocumentServerTimeoutError`, with the
deadline as `timeoutMs` and the abort `DOMException` as `cause`. An unreachable server rejects
with a `DocumentServerNetworkError` whose `cause` is the `TypeError: fetch failed`; its own
`cause` is, on Node, a system error with a `code` such as `"ECONNREFUSED"`, which the message
repeats, or an `AggregateError` of them when several addresses were tried. See
[Errors](errors.md#network-failures-and-timeouts).

**Validation.** The value must be a whole number of milliseconds from `1` to `2147483647`, the
largest delay a timer accepts:

```ts
new DocumentServerClient({ baseUrl: "https://docs.example.com", timeoutMs: 1.5 });
// TypeError: timeoutMs must be an integer from 1 to 2147483647, got: 1.5
```

Watch for computed values: `(2.5 * 1000) / 3` looks harmless, but it is not a whole number, so
the constructor refuses it.

### authorizationHeader and authorizationPrefix

They match the `token.inbox.header` and `token.inbox.prefix` settings of the document server.
[`getConfig()`](formats.md#server-configuration) returns them as `authorization`. They are used
only when a method gets a header token.

The prefix is joined to the token as is. The trailing space is part of the default, and an empty
string sends the bare token:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  authorizationHeader: "X-Docs-Token",
  authorizationPrefix: "",
});

await client.convert(request, token); // X-Docs-Token: <token>
```

A header with the same name in `headers` is left alone until a token is passed. Then it is
replaced, not merged.

### fetch

Your own `fetch` is the extension point for what the SDK doesn't do itself: a proxy or mTLS
agent, retries, logging, tracing, request mocking:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  fetch: (url, init) => {
    console.log("->", url);
    return fetch(url, init);
  },
});
```

Without the option, the global `fetch` is looked up on each call, not captured in the
constructor. So a `fetch` patched later, by msw or an instrumentation agent, is still used.

## Per-request options

Every method takes an optional last argument that overrides the client settings for one call:

```ts
await client.convert(request, token, {
  signal: controller.signal,
  timeoutMs: 120_000,
  headers: { "x-request-id": requestId },
});
```

| Option      | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `signal`    | Cancels the call. The deadline still applies alongside it.                     |
| `timeoutMs` | Deadline for this call, instead of the configured one. Validated the same way. |
| `headers`   | Headers laid over the configured ones. Names are matched case-insensitively.   |

**`signal`** is combined with the deadline through `AbortSignal.any()`, and whichever fires first
aborts the request. A cancelled call rejects with the signal's reason, unchanged; a call that
runs out of time with a `DocumentServerTimeoutError`. A signal doesn't turn the timeout off:
for a slow conversion, pass a larger `timeoutMs`.

**`headers`** are applied last: over the configured headers, and over the `content-type`,
`accept` and authorization headers the SDK sets itself. Names are matched case-insensitively,
so `{ "X-Tenant": "globex" }` replaces a configured `x-tenant` instead of adding a second one.

## The raw client

`client.raw` has the same nine endpoints. Each returns the untouched `Response` and never throws
on what the document server answers. A request that gets no answer at all still rejects with
`DocumentServerNetworkError` or `DocumentServerTimeoutError`:

```ts
const response = await client.raw.convert(request);

response.ok;
response.headers.get("x-request-id");

const result = (await response.json()) as ConvertResponse;
```

Use it when a status or a header matters to you, when you need to read the body another way, or
when you prefer errors as values.

The typed client sends its requests through this same instance, with the same options, headers,
deadline and `fetch`, so you can mix the two freely. `client.options` and `client.raw.options`
are the same frozen object.

`getFile()` differs the least: on a 2xx both return the `Response` unread, since a file is a
stream. They differ only on a failing status: the typed one rejects, the raw one returns the
response.

The typed `convertFromFile()` also gives the converted file unread, as `result.file`, but reads
a JSON answer: it returns the progress of an `async` conversion, rejects with a
`ConversionError` on an `error` code, and with a `DocumentServerParseError` on any other JSON.
A 2xx that is not JSON is taken as the file. The raw one returns every answer as it came.
