[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerTimeoutError

# Class: DocumentServerTimeoutError

The deadline, `timeoutMs`, passed before the answer was read. The `DOMException` named
`"TimeoutError"` is the `cause`.

A call cancelled with your own `signal` rejects with the reason of that signal instead, a
signal of `AbortSignal.timeout()` included.

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

| Property                                    | Modifier   | Type        | Description                                                                                                                                                                                                                                           |
| ------------------------------------------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`           | `readonly` | `"timeout"` | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response`   | `readonly` | `undefined` | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, even one that happens while the body is read.                                                                                        |
| <a id="property-timeoutms"></a> `timeoutMs` | `readonly` | `number`    | The deadline that passed, in milliseconds.                                                                                                                                                                                                            |
| <a id="property-url"></a> `url`             | `readonly` | `string`    | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is DocumentServerTimeoutError;
```

Returns whether `value` is a `DocumentServerTimeoutError`, also one thrown by a second copy of the package.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is DocumentServerTimeoutError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
