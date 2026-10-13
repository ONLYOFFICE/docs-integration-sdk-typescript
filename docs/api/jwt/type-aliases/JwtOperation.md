[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtOperation

# Type Alias: JwtOperation

```ts
type JwtOperation = "callback" | "command" | "converter" | "docbuilder" | "download";
```

The request a token is for, the `operation` claim.

Requests to the document server:

- `"converter"`: `/converter` and `/converter/from-file`;
- `"command"`: `/command`;
- `"docbuilder"`: `/docbuilder` and `/docbuilder/from-file`.

Requests the document server sends:

- `"download"`: a file download;
- `"callback"`: a callback to `callbackUrl`.
