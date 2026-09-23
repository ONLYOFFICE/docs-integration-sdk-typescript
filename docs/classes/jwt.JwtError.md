[@onlyoffice/docs-integration-sdk](../README.md) / [jwt](../modules/jwt.md) / JwtError

# Class: JwtError

A token that could not be trusted: malformed, signed with another algorithm or another
secret, expired, or not valid yet.

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

#### Parameters

| Parameter  | Type                                           |
| ---------- | ---------------------------------------------- |
| `kind`     | [`JwtErrorKind`](../types/jwt.JwtErrorKind.md) |
| `message`  | `string`                                       |
| `options?` | `ErrorOptions`                                 |

#### Returns

`JwtError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                 | Modifier   | Type                                           | Description                            |
| ------------------------ | ---------- | ---------------------------------------------- | -------------------------------------- |
| <a id="kind"></a> `kind` | `readonly` | [`JwtErrorKind`](../types/jwt.JwtErrorKind.md) | Which of the checks refused the token. |

## Methods

### is()

```ts
static is(value): value is JwtError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is JwtError`
