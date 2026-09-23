[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerError

# Class: DocumentServerError

Everything the document server answers with that the SDK turns into a rejection.

## Extends

- `Error`

## Extended by

- [`DocumentServerHttpError`](DocumentServerHttpError.md)
- [`DocumentServerParseError`](DocumentServerParseError.md)
- [`ConversionError`](ConversionError.md)
- [`CommandError`](CommandError.md)
- [`BuilderError`](BuilderError.md)

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
| `response` | `Response`                                                              |
| `options?` | `ErrorOptions`                                                          |

#### Returns

`DocumentServerError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                                  | Modifier   | Type                                                                    | Description                                                               |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind`         | `readonly` | [`DocumentServerErrorKind`](../type-aliases/DocumentServerErrorKind.md) | -                                                                         |
| <a id="property-response"></a> `response` | `readonly` | `Response`                                                              | The response the error was read from. Its body has already been consumed. |

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
