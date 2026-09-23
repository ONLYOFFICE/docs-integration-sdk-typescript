[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConversionError

# Class: ConversionError

The conversion service reported a failure in a body it answered `200 OK` with.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new ConversionError(code, response): ConversionError;
```

#### Parameters

| Parameter  | Type                                                            |
| ---------- | --------------------------------------------------------------- |
| `code`     | [`ConversionErrorCode`](../type-aliases/ConversionErrorCode.md) |
| `response` | `Response`                                                      |

#### Returns

`ConversionError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type                                                            | Description                                                                                                                                                         |
| ----------------------------------------- | ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-code"></a> `code`         | `readonly` | [`ConversionErrorCode`](../type-aliases/ConversionErrorCode.md) | -                                                                                                                                                                   |
| <a id="property-kind"></a> `kind`         | `readonly` | `"conversion"`                                                  | -                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response`                                                      | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did. |

## Methods

### is()

```ts
static is(value): value is ConversionError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is ConversionError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
