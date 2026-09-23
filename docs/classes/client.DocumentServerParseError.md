[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / DocumentServerParseError

# Class: DocumentServerParseError

The body of a successful response was not the JSON the endpoint promises.

## Extends

- [`DocumentServerError`](client.DocumentServerError.md)

## Constructors

### Constructor

```ts
new DocumentServerParseError(
   message,
   response,
   body,
   options?
): DocumentServerParseError;
```

#### Parameters

| Parameter  | Type           |
| ---------- | -------------- |
| `message`  | `string`       |
| `response` | `Response`     |
| `body`     | `string`       |
| `options?` | `ErrorOptions` |

#### Returns

`DocumentServerParseError`

#### Overrides

[`DocumentServerError`](client.DocumentServerError.md).[`constructor`](client.DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type       | Description                                                               |
| -------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------- |
| <a id="body"></a> `body`         | `readonly` | `string`   | Beginning of the response body, as far as it could be read.               |
| <a id="kind"></a> `kind`         | `readonly` | `"parse"`  | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response` | The response the error was read from. Its body has already been consumed. |

## Methods

### is()

```ts
static is(value): value is DocumentServerParseError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerParseError`

#### Overrides

[`DocumentServerError`](client.DocumentServerError.md).[`is`](client.DocumentServerError.md#is)
