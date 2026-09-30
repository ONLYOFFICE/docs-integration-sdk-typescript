[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerNetworkError

# Class: DocumentServerNetworkError

No answer came: the document server can't be reached, or the connection broke before the
answer was read, the body included.

The error `fetch` threw is the `cause`, such as `TypeError: fetch failed`. The message adds
the system error code under it, such as `ECONNREFUSED`, or else that error's message.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new DocumentServerNetworkError(url, cause): DocumentServerNetworkError;
```

Creates the error for a request that got no answer or lost it on the way.

#### Parameters

| Parameter | Type      | Description                                                 |
| --------- | --------- | ----------------------------------------------------------- |
| `url`     | `string`  | The URL of the request. The query is left out of the error. |
| `cause`   | `unknown` | What `fetch` or the body stream rejected with.              |

#### Returns

`DocumentServerNetworkError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type        | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`         | `readonly` | `"network"` | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `undefined` | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, even one that happens while the body is read.                                                                                        |
| <a id="property-url"></a> `url`           | `readonly` | `string`    | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is DocumentServerNetworkError;
```

Returns whether `value` is a `DocumentServerNetworkError`, also one thrown by a second copy of
the package, which `instanceof` misses.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerNetworkError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
