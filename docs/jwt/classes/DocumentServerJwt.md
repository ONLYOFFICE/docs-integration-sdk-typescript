[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / DocumentServerJwt

# Class: DocumentServerJwt

Signs the tokens the document server expects, over the secret it is configured with.

One signer stands for one secret. A server configured with separate `inbox`, `outbox`
and `session` secrets takes a signer for each.

## Constructors

### Constructor

```ts
new DocumentServerJwt(options): DocumentServerJwt;
```

#### Parameters

| Parameter | Type                                        |
| --------- | ------------------------------------------- |
| `options` | [`JwtOptions`](../interfaces/JwtOptions.md) |

#### Returns

`DocumentServerJwt`

## Properties

| Property                                | Modifier   | Type                                                                                          | Description                                                                                                                                                 |
| --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-options"></a> `options` | `readonly` | `Readonly`\<`Required`\<`Omit`\<[`JwtOptions`](../interfaces/JwtOptions.md), `"secret"`\>\>\> | The effective settings: validated, with the defaults applied, and frozen. The secret is kept out of them, so that logging the signer does not write it out. |

## Methods

### sign()

```ts
sign(payload, options?): Promise<string>;
```

Signs `payload` into a token in the compact serialization.

`iat` and `exp` are added, each unless the payload already carries it. A claim set to
`undefined` or `null` counts as not carried. `operation`, when given, is written over
the one the payload carries.

#### Parameters

| Parameter  | Type                                          |
| ---------- | --------------------------------------------- |
| `payload`  | `object`                                      |
| `options?` | [`SignOptions`](../interfaces/SignOptions.md) |

#### Returns

`Promise`\<`string`\>

#### Throws

when the payload is not a plain object — an array, a `Map`, an
instance of a class — or the lifetime is neither `null` nor a positive integer.

---

### signHeader()

```ts
signHeader(payload, options?): Promise<string>;
```

Signs `payload` into a token for a header of a request to the document server, which
takes the body of such a request wrapped as `{ payload: … }`.

`iat`, `exp` and `operation` go beside `payload`, as [DocumentServerJwt.sign](#sign)
writes them. The document server does not look for `operation` inside `payload`.

#### Parameters

| Parameter  | Type                                          |
| ---------- | --------------------------------------------- |
| `payload`  | `object`                                      |
| `options?` | [`SignOptions`](../interfaces/SignOptions.md) |

#### Returns

`Promise`\<`string`\>

#### Throws

whenever [DocumentServerJwt.sign](#sign) would.

---

### verify()

```ts
verify<T>(token, options?): Promise<T>;
```

Checks a token against the secret and the clock, and answers with what it carries.

The algorithm is the one the signer is configured with: a token naming another in its
header is refused rather than taken at its word. `exp` and `nbf` are honoured when
present, `iat` is not. The payload is parsed only once the signature has matched.

#### Type Parameters

| Type Parameter | Default type                    |
| -------------- | ------------------------------- |
| `T`            | `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                              |
| ---------- | ------------------------------------------------- |
| `token`    | `string`                                          |
| `options?` | [`VerifyOptions`](../interfaces/VerifyOptions.md) |

#### Returns

`Promise`\<`T`\>

#### Throws

[JwtError](JwtError.md) when the token is malformed, signed with another algorithm
or another secret, expired, or not valid yet.

---

### verifyHeader()

```ts
verifyHeader<T>(headers, options?): Promise<T>;
```

Checks the token the document server sent in a header of its request, and answers with
the `payload` it signs.

The document server signs what it sends — the download of a file, a callback — in the
`Authorization` header by default, as `Bearer <token>`, and the claims of such a token
wrap what the request is about under `payload`. The header and the prefix are the
`token.outbox.header` and `token.outbox.prefix` settings of the server.

#### Type Parameters

| Type Parameter | Default type                    |
| -------------- | ------------------------------- |
| `T`            | `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| `headers`  | [`JwtHeaders`](../type-aliases/JwtHeaders.md)                 |
| `options?` | [`VerifyHeaderOptions`](../interfaces/VerifyHeaderOptions.md) |

#### Returns

`Promise`\<`T`\>

#### Throws

[JwtError](JwtError.md) `missing` when the header carries no token, `malformed` when
the token carries no `payload` object, and whatever [DocumentServerJwt.verify](#verify)
refuses it with.
