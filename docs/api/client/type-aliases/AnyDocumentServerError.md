[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / AnyDocumentServerError

# Type Alias: AnyDocumentServerError

```ts
type AnyDocumentServerError =
  | BuilderError
  | CommandError
  | ConversionError
  | DocumentServerHttpError
  | DocumentServerNetworkError
  | DocumentServerParseError
  | DocumentServerTimeoutError;
```

Every error a client call rejects with, apart from the reason of a cancelled `signal`.
[DocumentServerError.is](../classes/DocumentServerError.md#is) narrows to it, so a `switch` over `kind` gives each branch
the fields of its error.
