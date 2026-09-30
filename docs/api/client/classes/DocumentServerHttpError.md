[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerHttpError

# Class: DocumentServerHttpError

The document server answered with a status outside the 2xx range. The message names the
status, the URL and the beginning of the body.

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

| Property                                  | Modifier   | Type       | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-body"></a> `body`         | `readonly` | `string`   | The first 512 characters of the response body, trimmed, ending with `…` when the body goes on. The body is read only that far, and for at most `timeoutMs`: what arrived by then, with `…`. Empty when nothing of it could be read.                   |
| <a id="property-kind"></a> `kind`         | `readonly` | `"http"`   | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response` | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, even one that happens while the body is read.                                                                                        |
| <a id="property-status"></a> `status`     | `readonly` | `number`   | The status of the response.                                                                                                                                                                                                                           |
| <a id="property-url"></a> `url`           | `readonly` | `string`   | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is DocumentServerHttpError;
```

Returns whether `value` is a `DocumentServerHttpError`, also one thrown by a second copy of the
package, which `instanceof` misses.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerHttpError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
