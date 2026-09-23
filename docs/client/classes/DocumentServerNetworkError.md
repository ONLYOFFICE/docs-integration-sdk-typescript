[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerNetworkError

# Class: DocumentServerNetworkError

No answer came: the document server could not be reached, or the connection broke before
its answer had been read. The error `fetch` raised is the `cause`.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new DocumentServerNetworkError(url, cause): DocumentServerNetworkError;
```

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `url`     | `string`  |
| `cause`   | `unknown` |

#### Returns

`DocumentServerNetworkError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type        | Description                                                                                                                                                         |
| ----------------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`         | `readonly` | `"network"` | -                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `undefined` | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did. |
| <a id="property-url"></a> `url`           | `readonly` | `string`    | Where the request went, the query left out. Empty when that is not known.                                                                                           |

## Methods

### is()

```ts
static is(value): value is DocumentServerNetworkError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerNetworkError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
