[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtOperation

# Type Alias: JwtOperation

```ts
type JwtOperation = "converter" | "command" | "docbuilder";
```

The endpoint a token is meant for: `"converter"` for `/converter` and
`/converter/from-file`, `"command"` for `/command`, `"docbuilder"` for `/docbuilder` and
`/docbuilder/from-file`.
