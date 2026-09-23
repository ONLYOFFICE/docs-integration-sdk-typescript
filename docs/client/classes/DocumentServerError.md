[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerError

# Class: DocumentServerError

Every failure of a call to the document server that the SDK turns into a rejection: a
failure the server reports, an answer that is not the one promised, or no answer at all.

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
| `options?` | `ErrorOptions`                                                          |

#### Returns

`DocumentServerError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                                  | Modifier   | Type                                                                    | Description                                                                                                                                                         |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`         | `readonly` | [`DocumentServerErrorKind`](../type-aliases/DocumentServerErrorKind.md) | -                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response` \| `undefined`                                               | The response the error was read from. Its body has already been consumed. Absent from a network failure and a timeout, which may have come before any response did. |

## Methods

### is()

```ts
static is(value): value is AnyDocumentServerError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is AnyDocumentServerError`
