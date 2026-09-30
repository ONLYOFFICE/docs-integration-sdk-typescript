[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerError

# Class: DocumentServerError

The base class of every error a client call rejects with: a failure the document server
reports, an answer that is not the promised one, or no answer at all.

## Example

```ts
try {
  await client.convert(request);
} catch (error) {
  if (ConversionError.is(error) && error.code === -5) {
    return askForThePassword();
  }

  if (DocumentServerHttpError.is(error) && error.status >= 500) {
    return retryLater();
  }

  throw error;
}
```

## See

[Errors](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/errors.md)

## Extends

- `Error`

## Extended by

- [`DocumentServerHttpError`](DocumentServerHttpError.md)
- [`DocumentServerParseError`](DocumentServerParseError.md)
- [`ConversionError`](ConversionError.md)
- [`CommandError`](CommandError.md)
- [`BuilderError`](BuilderError.md)
- [`DocumentServerNetworkError`](DocumentServerNetworkError.md)
- [`DocumentServerTimeoutError`](DocumentServerTimeoutError.md)

## Constructors

### Constructor

```ts
new DocumentServerError(
   kind,
   message,
   response,
   options?
): DocumentServerError;
```

#### Parameters

| Parameter  | Type                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `kind`     | [`DocumentServerErrorKind`](../type-aliases/DocumentServerErrorKind.md) |
| `message`  | `string`                                                                |
| `response` | `Response` \| `undefined`                                               |
| `options?` | `ErrorOptions` & \{ `url?`: `string`; \}                                |

#### Returns

`DocumentServerError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                                  | Modifier   | Type                                                                    | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`         | `readonly` | [`DocumentServerErrorKind`](../type-aliases/DocumentServerErrorKind.md) | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response` \| `undefined`                                               | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, even one that happens while the body is read.                                                                                        |
| <a id="property-url"></a> `url`           | `readonly` | `string`                                                                | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is AnyDocumentServerError;
```

Returns whether `value` is any of the client errors, also one thrown by a second copy of
the package, which `instanceof` misses. Narrows to [AnyDocumentServerError](../type-aliases/AnyDocumentServerError.md).

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is AnyDocumentServerError`
