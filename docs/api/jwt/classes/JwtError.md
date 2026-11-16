[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtError

# Class: JwtError

Thrown by [DocumentServerJwt.verify](DocumentServerJwt.md#verify) and [DocumentServerJwt.verifyHeader](DocumentServerJwt.md#verifyheader) when a
token can't be trusted. Reply to such a request with `403`.

Separate from the client errors: `JwtError.is()` and `DocumentServerError.is()` never both
return `true`.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new JwtError(
   kind,
   message,
   options?
): JwtError;
```

Creates the error, for a signer or verifier of your own that refuses a token the same way.

#### Parameters

| Parameter  | Type                                              | Description                                           |
| ---------- | ------------------------------------------------- | ----------------------------------------------------- |
| `kind`     | [`JwtErrorKind`](../type-aliases/JwtErrorKind.md) | Which check refused the token.                        |
| `message`  | `string`                                          | What was wrong, for a log.                            |
| `options?` | `ErrorOptions`                                    | The `cause`, such as the error the check failed with. |

#### Returns

`JwtError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                          | Modifier   | Type                                              | Description                    |
| --------------------------------- | ---------- | ------------------------------------------------- | ------------------------------ |
| <a id="property-kind"></a> `kind` | `readonly` | [`JwtErrorKind`](../type-aliases/JwtErrorKind.md) | Which check refused the token. |

## Methods

### is()

```ts
static is(value): value is JwtError;
```

Returns whether `value` is a `JwtError`, also one thrown by a second copy of the package,
which `instanceof` misses.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is JwtError`
