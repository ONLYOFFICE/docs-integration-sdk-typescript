# Errors

A client call rejects when no answer came, when the answer is not what the endpoint promises, or
when the document server reports a failure.

- [Error classes](#error-classes)
- [Handle an error](#handle-an-error)
- [Error codes](#error-codes)
- [Network failures and timeouts](#network-failures-and-timeouts)
- [What doesn't throw](#what-doesnt-throw)

## Error classes

| Error                        | `kind`         | Thrown when                                                                                                       |
| ---------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DocumentServerNetworkError` | `"network"`    | No answer came: the server was unreachable or the connection broke. Has `cause`.                                  |
| `DocumentServerTimeoutError` | `"timeout"`    | The deadline passed before the answer was read. Has `timeoutMs` and `cause`.                                      |
| `DocumentServerHttpError`    | `"http"`       | The status is outside 2xx. Has `status` and the beginning of the `body`.                                          |
| `DocumentServerParseError`   | `"parse"`      | A 2xx body is not the JSON the endpoint promises. Has the `body`, and the parse error as `cause`.                 |
| `ConversionError`            | `"conversion"` | `/converter` or `/converter/from-file` answered `200 OK` with an `error` code other than `0`. Has it as `code`.   |
| `CommandError`               | `"command"`    | `/command` answered with an `error` other than `0` and `4`. Has it as `code`.                                     |
| `BuilderError`               | `"builder"`    | `/docbuilder` or `/docbuilder/from-file` answered `200 OK` with an `error` code other than `0`. Has it as `code`. |

All seven extend `DocumentServerError`. The [JWT](jwt.md#verify-a-token),
[config](editor.md#validation-errors) and [callback](callback.md#invalid-requests) errors are
separate classes.

**`response`.** The last five errors carry the `response` they were read from. Its body is
already consumed, so a truncated copy of it is on the error. A network error or a timeout may
happen before any response, so their `response` is `undefined`.

**`url`.** Every error has the `url` of the request, which tells two document servers apart in a
log, for example the internal and the public address of the same server. The query is left out,
since a download link has its signature there. An error read from a response takes
`response.url`, so it shows where a redirect ended. It is empty when your own
[`fetch`](client.md#fetch) returns a hand-built `Response`. An HTTP error also puts it in the
message:

```ts
// DocumentServerHttpError: the document server answered 502 Bad Gateway at
// http://docs.internal/meta/formats: <html>…
```

> [!TIP]
> Expect `DocumentServerParseError` even in a healthy integration. A reverse proxy that answers
> `200 OK` with its own page would otherwise show up as a bare `SyntaxError` from `JSON.parse`.

## Handle an error

Each class has a static `is()`. `DocumentServerError.is()` matches any of the seven:

```ts
try {
  await client.convert(request);
} catch (error) {
  if (ConversionError.is(error) && error.code === -5) {
    return askForThePassword();
  }

  if (DocumentServerHttpError.is(error) && error.status >= 500) {
    return retryLater();
  }

  throw error;
}
```

> [!IMPORTANT]
> Prefer `is()` over `instanceof`. The package ships ESM and CJS. If one part of an application
> imports it and another requires it, it is loaded twice, with two copies of every class. An
> error from one copy then fails `instanceof` against the other, and this shows up in someone
> else's bundler, not in your tests. `is()` checks a mark both copies share.

`kind` answers the same question as a value, for a `switch` or a log line.
`DocumentServerError.is()` narrows to a union discriminated on `kind`, so every branch gets the
fields of its own error:

```ts
if (DocumentServerError.is(error)) {
  switch (error.kind) {
    case "http":
      return report(error.status);
    case "parse":
      return report(error.body);
    case "conversion":
    case "command":
    case "builder":
      return report(error.code);
    case "network":
    case "timeout":
      return report(error.url);
  }
}
```

## Error codes

`code` keeps the documented codes as literals: `-5` is autocompleted, and `case -5:` narrows.
The codes are listed on `ConversionErrorCode`, `CommandErrorCode` and `BuilderErrorCode`.

A code the service doesn't document stays a plain number. A newer document server may return a
code this SDK doesn't know. It arrives as `code`, with `unrecognized error code` in the message.
So a `switch` over `code` is never exhaustive: keep a `default` branch.

## Network failures and timeouts

Network failures and timeouts are wrapped too. So `DocumentServerError.is()` matches every way a
call to the document server can fail, and you can tell a server failure from a bug of your own
without catching everything.

What `fetch` threw is kept as `cause`: a `TypeError: fetch failed` with the system error under
it, or a `DOMException` named `"TimeoutError"`. The message has the system error code when there
is one, or the message of the underlying error:

```ts
// DocumentServerNetworkError: the document server could not be reached at
// http://docs.internal/meta/formats: fetch failed (ECONNREFUSED)
```

Both cover a body that breaks off while it is read, as well as a request that never got a
response. Both take `url` from the request, since there may be no response. See
[`timeoutMs`](client.md#timeoutms).

**Cancelling is not wrapped.** A call cancelled through your own `signal` rejects with the
signal's reason, unchanged, including a signal from `AbortSignal.timeout()`. Cancelling is your
decision, not a server failure.

## What doesn't throw

Apart from that reason, a call throws only the seven errors above. Two outcomes don't throw:

- `healthcheck()` returns `false` for a failing status: a server that is down is the answer you
  asked for.
- `error: 4` from `forcesave` is returned on the result: nothing to save is an outcome, not a
  failure.

> [!NOTE]
> The SDK sends one request per call. Retries, polling and backoff are up to you, for example in
> a custom [`fetch`](client.md#fetch).
