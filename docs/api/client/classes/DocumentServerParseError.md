[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerParseError

# Class: DocumentServerParseError

A 2xx body is not the JSON the endpoint promises: not JSON at all, or JSON of another shape.
Expect it even in a healthy integration: a reverse proxy may answer `200 OK` with a page of
its own. For a body that is not JSON, the parse error is the `cause`.

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

| Property                                  | Modifier   | Type       | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-body"></a> `body`         | `readonly` | `string`   | The first 512 characters of the response body, trimmed.                                                                                                                                                                                               |
| <a id="property-kind"></a> `kind`         | `readonly` | `"parse"`  | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response` | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, which can happen before any response.                                                                                                |
| <a id="property-url"></a> `url`           | `readonly` | `string`   | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is DocumentServerParseError;
```

Returns whether `value` is a `DocumentServerParseError`, also one thrown by a second copy of the package.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerParseError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
