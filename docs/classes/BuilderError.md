[@onlyoffice/docs-integration-sdk](../README.md) / BuilderError

# Class: BuilderError

The builder service reported a failure in a body it answered `200 OK` with.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new BuilderError(code, response): BuilderError;
```

#### Parameters

| Parameter  | Type                                               |
| ---------- | -------------------------------------------------- |
| `code`     | [`BuilderErrorCode`](../types/BuilderErrorCode.md) |
| `response` | `Response`                                         |

#### Returns

`BuilderError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type                                               | Description                                                               |
| -------------------------------- | ---------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="code"></a> `code`         | `readonly` | [`BuilderErrorCode`](../types/BuilderErrorCode.md) | -                                                                         |
| <a id="kind"></a> `kind`         | `readonly` | `"builder"`                                        | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response`                                         | The response the error was read from. Its body has already been consumed. |

## Methods

### is()

```ts
static is(value): value is BuilderError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is BuilderError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
