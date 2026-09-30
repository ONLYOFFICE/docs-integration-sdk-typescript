# JWT

`DocumentServerJwt` signs the tokens the document server expects and checks the tokens it sends.
It has no dependencies: HMAC comes from WebCrypto, which every supported runtime provides.

- [Sign a token](#sign-a-token)
- [Body token and header token](#body-token-and-header-token)
- [The operation claim](#the-operation-claim)
- [Verify a token](#verify-a-token)
- [Verify a token from a header](#verify-a-token-from-a-header)
- [Several secrets](#several-secrets)

## Sign a token

```ts
import { DocumentServerJwt } from "@onlyoffice/docs-integration-sdk";

const jwt = new DocumentServerJwt({ secret });
const token = await jwt.sign({ key: "Khirz6zTPdfd7", url: "https://example.com/contract.docx" });
```

`sign()` adds `iat` and `exp` unless the payload already has them. The default lifetime is five
minutes. Change it with `expiresInSec`, on the signer or on one call. `null` leaves `exp` out, so
the token never expires:

```ts
const jwt = new DocumentServerJwt({ secret, expiresInSec: 60 });

await jwt.sign(payload); // expires in a minute
await jwt.sign(payload, { expiresInSec: 3600 }); // in an hour
await jwt.sign(payload, { expiresInSec: null }); // never
```

`algorithm` is `"HS256"` (default), `"HS384"` or `"HS512"`. Use the one your document server is
configured with.

## Body token and header token

The conversion, command and builder services accept a token in one of two places, signed over
different payloads:

| Where  | Signed over                  | Method                    |
| ------ | ---------------------------- | ------------------------- |
| body   | the request body             | `jwt.sign(request)`       |
| header | the body as `{ payload: … }` | `jwt.signHeader(request)` |

```ts
// In the body, as a field of the request.
await client.convert({ ...request, token: await jwt.sign(request) });

// In a header, as the second argument.
await client.convert(request, await jwt.signHeader(request));
```

`signHeader()` wraps the body as `{ payload: … }` and puts `iat`, `exp` and `operation` next to
it. So `jwt.signHeader(request)` is the same as `jwt.sign({ payload: request })`.

You can send both tokens, as long as each is signed over its own payload. The same token in both
places fails with error `-8`. Without the header argument, no authorization header is sent,
which is what a server without a secret expects.

## The operation claim

`operation` names the endpoint a token is for: `"converter"`, `"command"` or `"docbuilder"`. It
is written as a top-level claim and overrides an `operation` field of the payload:

```ts
await jwt.sign(request, { operation: "converter" });
await jwt.signHeader(request, { operation: "converter" });
```

The document server refuses a token whose `operation` names another endpoint, so a token signed
for a conversion can't be replayed as a command.

| Endpoint                                | `operation`              |
| --------------------------------------- | ------------------------ |
| `/converter`, `/command`, `/docbuilder` | optional                 |
| `/converter/from-file`                  | required, `"converter"`  |
| `/docbuilder/from-file`                 | required, `"docbuilder"` |

The document server looks for the claim at the top level of the token only, not inside
`payload`.

## Verify a token

`verify()` returns what the token carries, or rejects with a `JwtError` if the token can't be
trusted:

```ts
try {
  const claims = await jwt.verify<CallbackPayload>(token);
} catch (error) {
  if (JwtError.is(error)) {
    // 403: error.kind says which check refused it
  }
}
```

> [!TIP]
> A `callbackUrl` handler must check the token: without it, anyone who knows the URL can post to
> it. [`DocumentServerCallback`](callback.md) does this check for you.

`kind` is one of:

| `kind`        | Meaning                            |
| ------------- | ---------------------------------- |
| `"malformed"` | not a valid JWT                    |
| `"algorithm"` | the header names another algorithm |
| `"signature"` | the signature doesn't match        |
| `"expired"`   | `exp` is in the past               |
| `"premature"` | `nbf` is in the future             |
| `"missing"`   | the header carries no token        |

How the check works:

- The algorithm is the one the signer is configured with. A token that names another algorithm
  is refused before anything is computed, so `alg: "none"` never passes.
- `exp` and `nbf` are checked when present and must be numbers. `iat` is ignored.
- The payload is parsed only after the signature matches.

`clockToleranceSec` allows for a document server whose clock differs from yours, in seconds. It
defaults to `0` and can be set on the signer or on one call:

```ts
const jwt = new DocumentServerJwt({ secret, clockToleranceSec: 30 });

await jwt.verify(token, { clockToleranceSec: 0 });
```

`JwtError` and the [client errors](errors.md) are separate: `JwtError.is()` and
`DocumentServerError.is()` never both return `true` for the same value.

## Verify a token from a header

The document server signs its own requests, such as a file download or a callback, in a header:
`Authorization: Bearer <token>` by default. The claims wrap the request data in `payload`.
`verifyHeader()` reads the token from the headers, checks it like `verify()` and returns that
`payload`:

```ts
const { url } = await jwt.verifyHeader<{ url: string }>(request.headers);
```

It takes fetch `Headers` or a plain Node headers object, and matches header names in any case.
If the server sets its own `token.outbox.header` or `token.outbox.prefix`, pass the same values.
An empty prefix reads a bare token:

```ts
await jwt.verifyHeader(headers, { authorizationHeader: "X-Docs-Token", authorizationPrefix: "" });
```

Errors:

- no header, another prefix, or the prefix alone → `"missing"`;
- a token without a `payload` object → `"malformed"`.

Use `"missing"` to handle a request that may come from the document server or from a user, such
as a download:

```ts
try {
  await jwt.verifyHeader(request.headers);
} catch (error) {
  if (!JwtError.is(error) || error.kind !== "missing") throw error;
  // no token: the request did not come from the document server
}
```

## Several secrets

The secret belongs to the signer, so the key is imported once and reused for every token. If
the document server uses separate secrets for what it receives, what it sends and the editor
session, create a signer for each:

```ts
const inbox = new DocumentServerJwt({ secret: inboxSecret });
const outbox = new DocumentServerJwt({ secret: outboxSecret });

await client.convert(request, await inbox.signHeader(request));
```

A server with one secret everywhere, the common case, needs one signer.
