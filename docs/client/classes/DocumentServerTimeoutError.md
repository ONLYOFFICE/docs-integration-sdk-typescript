[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerTimeoutError

# Class: DocumentServerTimeoutError

The deadline of the call ran out before the answer had been read. The `DOMException` the
abort raised is the `cause`.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new DocumentServerTimeoutError(
   url,
   timeoutMs,
   cause
): DocumentServerTimeoutError;
```

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `url`       | `string`  |
| `timeoutMs` | `number`  |
| `cause`     | `unknown` |

#### Returns

`DocumentServerTimeoutError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                    | Modifier   | Type        | Description                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`           | `readonly` | `"timeout"` | -                                                                                                                                                                                                                                                             |
| <a id="property-response"></a> `response`   | `readonly` | `undefined` | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did.                                                                                           |
| <a id="property-timeoutms"></a> `timeoutMs` | `readonly` | `number`    | The deadline that ran out, in milliseconds.                                                                                                                                                                                                                   |
| <a id="property-url"></a> `url`             | `readonly` | `string`    | Where the request went, the query left out: a download link carries its signature there. Read off the response when there is one, redirects followed. Empty when it is not known, as from a `fetch` of your own that answers with a `Response` built by hand. |

## Methods

### is()

```ts
static is(value): value is DocumentServerTimeoutError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerTimeoutError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
