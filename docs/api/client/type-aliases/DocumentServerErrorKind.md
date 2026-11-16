[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerErrorKind

# Type Alias: DocumentServerErrorKind

```ts
type DocumentServerErrorKind =
  "builder" | "command" | "conversion" | "http" | "network" | "parse" | "timeout";
```

Which failure an error stands for, the discriminant of [AnyDocumentServerError](AnyDocumentServerError.md):

- `"network"`: [DocumentServerNetworkError](../classes/DocumentServerNetworkError.md), no answer came;
- `"timeout"`: [DocumentServerTimeoutError](../classes/DocumentServerTimeoutError.md), the deadline passed;
- `"http"`: [DocumentServerHttpError](../classes/DocumentServerHttpError.md), a status outside the 2xx range;
- `"parse"`: [DocumentServerParseError](../classes/DocumentServerParseError.md), a 2xx body that is not the promised JSON;
- `"conversion"`: [ConversionError](../classes/ConversionError.md), an error code of the conversion service;
- `"command"`: [CommandError](../classes/CommandError.md), an error code of the command service;
- `"builder"`: [BuilderError](../classes/BuilderError.md), an error code of the document builder service.
