[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtOperation

# Type Alias: JwtOperation

```ts
type JwtOperation = "converter" | "command" | "docbuilder";
```

The endpoint a token is for, written to the `operation` claim:

- `"converter"`: `/converter` and `/converter/from-file`;
- `"command"`: `/command`;
- `"docbuilder"`: `/docbuilder` and `/docbuilder/from-file`.
