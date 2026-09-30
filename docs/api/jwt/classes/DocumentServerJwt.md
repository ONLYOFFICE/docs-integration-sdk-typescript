[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / DocumentServerJwt

# Class: DocumentServerJwt

Signs the tokens the document server expects and verifies the tokens it sends. HMAC comes
from WebCrypto, so there are no dependencies.

One signer holds one secret. A document server with separate `inbox`, `outbox` and
`session` secrets needs a signer for each.

## Example

```ts
const jwt = new DocumentServerJwt({ secret: process.env["DOCS_JWT_SECRET"] ?? "" });

await client.convert({ ...request, token: await jwt.sign(request) });
await client.convert(request, await jwt.signHeader(request));

const claims = await jwt.verify(token);
```

## See

[JWT](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/jwt.md)

## Constructors

### Constructor

```ts
new DocumentServerJwt(options): DocumentServerJwt;
```

#### Parameters

| Parameter | Type                                        | Description                                  |
| --------- | ------------------------------------------- | -------------------------------------------- |
| `options` | [`JwtOptions`](../interfaces/JwtOptions.md) | The secret, and the defaults of every token. |

#### Returns

`DocumentServerJwt`

#### Throws

when `secret` is empty, `algorithm` is not one of
[JwtAlgorithm](../type-aliases/JwtAlgorithm.md), `expiresInSec` is neither `null` nor a whole number from `1` to
`2147483647`, or `clockToleranceSec` is not a whole number from `0` to `2147483647`.

## Properties

| Property                                | Modifier   | Type                                                                                          | Description                                                                                                                    |
| --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-options"></a> `options` | `readonly` | `Readonly`\<`Required`\<`Omit`\<[`JwtOptions`](../interfaces/JwtOptions.md), `"secret"`\>\>\> | The settings in effect: validated, with defaults, and frozen. The secret is left out, so logging the signer doesn't reveal it. |

## Methods

### sign()

```ts
sign(payload, options?): Promise<string>;
```

Signs `payload` into a token. Use it for a token in the request body, which signs the body
itself.

Claims added to the payload:

- `iat`, the current time, unless the payload has one;
- `exp`, the current time plus `expiresInSec`, unless the payload has one. Left out when
  `expiresInSec` is `null`;
- `operation`, when given in `options`, over an `operation` the payload has.

A claim that is `undefined` or `null` in the payload counts as missing.

#### Parameters

| Parameter  | Type                                          | Description                                                    |
| ---------- | --------------------------------------------- | -------------------------------------------------------------- |
| `payload`  | `object`                                      | A plain object: its prototype is `Object.prototype` or `null`. |
| `options?` | [`SignOptions`](../interfaces/SignOptions.md) | The lifetime and the `operation` claim of this token.          |

#### Returns

`Promise`\<`string`\>

The token, in the compact serialization.

#### Example

```ts
await jwt.sign(payload); // expires in 5 minutes
await jwt.sign(payload, { expiresInSec: 3600 }); // in an hour
await jwt.sign(payload, { expiresInSec: null }); // never
await jwt.sign(request, { operation: "converter" });
```

#### Throws

when `payload` is not a plain object, such as an array, a `Map` or an
instance of a class, or when `expiresInSec` is invalid.

---

### signHeader()

```ts
signHeader(payload, options?): Promise<string>;
```

Signs `payload` into a token for the authorization header of a request. The document
server expects that token to sign the body wrapped as `{ payload: … }`, so
`signHeader(body)` is `sign({ payload: body })`.

`iat`, `exp` and `operation` are added next to `payload`, as
[DocumentServerJwt.sign](#sign) adds them. The document server doesn't look for `operation`
inside `payload`.

#### Parameters

| Parameter  | Type                                          | Description                                           |
| ---------- | --------------------------------------------- | ----------------------------------------------------- |
| `payload`  | `object`                                      | The request body, a plain object.                     |
| `options?` | [`SignOptions`](../interfaces/SignOptions.md) | The lifetime and the `operation` claim of this token. |

#### Returns

`Promise`\<`string`\>

The token, to pass as the header argument of a client method.

#### Throws

whenever [DocumentServerJwt.sign](#sign) would.

---

### verify()

```ts
verify<T>(token, options?): Promise<T>;
```

Verifies a token and returns its claims.

The checks, in order:

1. The `alg` of the token header must be the configured algorithm. A token that names
   another, `"none"` included, is refused before the signature is checked.
2. The signature must match the secret.
3. `exp` and `nbf`, when present, must be numbers, and the current time must be within
   them, give or take `clockToleranceSec`. `iat` is not checked.

The payload is parsed only after the signature matches.

#### Type Parameters

| Type Parameter | Default type                    |
| -------------- | ------------------------------- |
| `T`            | `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                              | Description                              |
| ---------- | ------------------------------------------------- | ---------------------------------------- |
| `token`    | `string`                                          | The token, in the compact serialization. |
| `options?` | [`VerifyOptions`](../interfaces/VerifyOptions.md) | The leeway for this token.               |

#### Returns

`Promise`\<`T`\>

The claims, typed as `T`. The type is not checked.

#### Throws

[JwtError](JwtError.md) of kind:

- `"malformed"` when the token is not a string of three segments, a segment is not
  canonical base64url, the header or the payload is not a JSON object, or `exp` or `nbf` is
  not a number;
- `"algorithm"` when the header names another algorithm;
- `"signature"` when the signature doesn't match;
- `"expired"` when `exp` has passed;
- `"premature"` when `nbf` has not come yet.

#### Throws

when `clockToleranceSec` is invalid.

---

### verifyHeader()

```ts
verifyHeader<T>(headers, options?): Promise<T>;
```

Reads the token from the authorization header of a request the document server sent, such
as a file download, verifies it and returns its `payload` claim.

The document server sends `Authorization: Bearer <token>` by default, and its claims wrap
the request data in `payload`.

#### Type Parameters

| Type Parameter | Default type                    |
| -------------- | ------------------------------- |
| `T`            | `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                                          | Description                            |
| ---------- | ------------------------------------------------------------- | -------------------------------------- |
| `headers`  | [`JwtHeaders`](../type-aliases/JwtHeaders.md)                 | The headers of the request.            |
| `options?` | [`VerifyHeaderOptions`](../interfaces/VerifyHeaderOptions.md) | The header, the prefix and the leeway. |

#### Returns

`Promise`\<`T`\>

The `payload` claim, typed as `T`. The type is not checked.

#### Example

```ts
const { url } = await jwt.verifyHeader<{ url: string }>(request.headers);
```

#### Throws

[JwtError](JwtError.md) of kind `"missing"` when the header is missing, has another
prefix or holds only the prefix. Use it to tell a request of the document server from one
of a user.

#### Throws

[JwtError](JwtError.md) of kind `"malformed"` when the token has no `payload` object, and
any error [DocumentServerJwt.verify](#verify) throws.
