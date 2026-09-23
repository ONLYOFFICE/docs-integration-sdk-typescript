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
`undefined` or `null` counts as not carried.

#### Parameters

| Parameter  | Type                                          |
| ---------- | --------------------------------------------- |
| `payload`  | `object`                                      |
| `options?` | [`SignOptions`](../interfaces/SignOptions.md) |

#### Returns

`Promise`\<`string`\>

#### Throws

when the payload is an array, or the lifetime is neither `null`
nor a positive integer.

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
