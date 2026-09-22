[@onlyoffice/docs-integration-sdk](../README.md) / ConversionError

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

| Parameter  | Type                                                     |
| ---------- | -------------------------------------------------------- |
| `code`     | [`ConversionErrorCode`](../types/ConversionErrorCode.md) |
| `response` | `Response`                                               |

#### Returns

`ConversionError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type                                                     | Description                                                               |
| -------------------------------- | ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="code"></a> `code`         | `readonly` | [`ConversionErrorCode`](../types/ConversionErrorCode.md) | -                                                                         |
| <a id="kind"></a> `kind`         | `readonly` | `"conversion"`                                           | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response`                                               | The response the error was read from. Its body has already been consumed. |

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
