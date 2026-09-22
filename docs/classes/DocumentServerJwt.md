[@onlyoffice/docs-integration-sdk](../README.md) / DocumentServerJwt

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

| Property                       | Modifier   | Type                                                                    | Description                                                               |
| ------------------------------ | ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="options"></a> `options` | `readonly` | `Readonly`\<`Required`\<[`JwtOptions`](../interfaces/JwtOptions.md)\>\> | The effective settings: validated, with the defaults applied, and frozen. |

## Methods

### sign()

```ts
sign(payload, options?): Promise<string>;
```

Signs `payload` into a token in the compact serialization.

`iat` and `exp` are added, each unless the payload already carries it.

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
