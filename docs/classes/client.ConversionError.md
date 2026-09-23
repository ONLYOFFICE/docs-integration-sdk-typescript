[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / ConversionError

# Class: ConversionError

The conversion service reported a failure in a body it answered `200 OK` with.

## Extends

- [`DocumentServerError`](client.DocumentServerError.md)

## Constructors

### Constructor

```ts
new ConversionError(code, response): ConversionError;
```

#### Parameters

| Parameter  | Type                                                            |
| ---------- | --------------------------------------------------------------- |
| `code`     | [`ConversionErrorCode`](../types/client.ConversionErrorCode.md) |
| `response` | `Response`                                                      |

#### Returns

`ConversionError`

#### Overrides

[`DocumentServerError`](client.DocumentServerError.md).[`constructor`](client.DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type                                                            | Description                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="code"></a> `code`         | `readonly` | [`ConversionErrorCode`](../types/client.ConversionErrorCode.md) | -                                                                         |
| <a id="kind"></a> `kind`         | `readonly` | `"conversion"`                                                  | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response`                                                      | The response the error was read from. Its body has already been consumed. |

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

[`DocumentServerError`](client.DocumentServerError.md).[`is`](client.DocumentServerError.md#is)
