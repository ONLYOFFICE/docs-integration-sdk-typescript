[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConversionError

# Class: ConversionError

The conversion service answered `200 OK` with an error code. Thrown by [DocumentServerClient.convert](DocumentServerClient.md#convert) and [DocumentServerClient.convertFromFile](DocumentServerClient.md#convertfromfile).
The message names the code and what it means.

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

| Property                                  | Modifier   | Type                                                            | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-code"></a> `code`         | `readonly` | [`ConversionErrorCode`](../type-aliases/ConversionErrorCode.md) | The error code, one of [ConversionErrorCode](../type-aliases/ConversionErrorCode.md). A code the service doesn't document stays a plain number, so keep a `default` branch in a `switch` over it.                                                     |
| <a id="property-kind"></a> `kind`         | `readonly` | `"conversion"`                                                  | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response`                                                      | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, even one that happens while the body is read.                                                                                        |
| <a id="property-url"></a> `url`           | `readonly` | `string`                                                        | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is ConversionError;
```

Returns whether `value` is a `ConversionError`, also one thrown by a second copy of the package.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is ConversionError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
