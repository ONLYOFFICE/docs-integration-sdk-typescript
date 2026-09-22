[@onlyoffice/docs-integration-sdk](../README.md) / DocumentServerHttpError

# Class: DocumentServerHttpError

The document server answered with a status outside the 2xx range.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new DocumentServerHttpError(response, body): DocumentServerHttpError;
```

#### Parameters

| Parameter  | Type       |
| ---------- | ---------- |
| `response` | `Response` |
| `body`     | `string`   |

#### Returns

`DocumentServerHttpError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type       | Description                                                               |
| -------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------- |
| <a id="body"></a> `body`         | `readonly` | `string`   | Beginning of the response body, as far as it could be read.               |
| <a id="kind"></a> `kind`         | `readonly` | `"http"`   | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response` | The response the error was read from. Its body has already been consumed. |
| <a id="status"></a> `status`     | `readonly` | `number`   | -                                                                         |

## Methods

### is()

```ts
static is(value): value is DocumentServerHttpError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerHttpError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
