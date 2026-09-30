[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerParseError

# Class: DocumentServerParseError

The body of a successful response was not the JSON the endpoint promises.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

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

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type       | Description                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-body"></a> `body`         | `readonly` | `string`   | Beginning of the response body, as far as it could be read.                                                                                                                                                                                                   |
| <a id="property-kind"></a> `kind`         | `readonly` | `"parse"`  | -                                                                                                                                                                                                                                                             |
| <a id="property-response"></a> `response` | `readonly` | `Response` | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did.                                                                                           |
| <a id="property-url"></a> `url`           | `readonly` | `string`   | Where the request went, the query left out: a download link carries its signature there. Read off the response when there is one, redirects followed. Empty when it is not known, as from a `fetch` of your own that answers with a `Response` built by hand. |

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

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
