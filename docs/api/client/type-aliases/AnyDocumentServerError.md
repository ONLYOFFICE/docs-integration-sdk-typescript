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

Every error the SDK throws of its own accord.
