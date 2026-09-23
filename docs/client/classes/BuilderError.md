[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuilderError

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

| Parameter  | Type                                                      |
| ---------- | --------------------------------------------------------- |
| `code`     | [`BuilderErrorCode`](../type-aliases/BuilderErrorCode.md) |
| `response` | `Response`                                                |

#### Returns

`BuilderError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type                                                      | Description                                                                                                                                                         |
| ----------------------------------------- | ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-code"></a> `code`         | `readonly` | [`BuilderErrorCode`](../type-aliases/BuilderErrorCode.md) | -                                                                                                                                                                   |
| <a id="property-kind"></a> `kind`         | `readonly` | `"builder"`                                               | -                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response`                                                | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did. |

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
