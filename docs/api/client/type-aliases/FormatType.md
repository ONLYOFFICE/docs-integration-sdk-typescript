[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / FormatType

# Type Alias: FormatType

```ts
type FormatType = "" | "cell" | "diagram" | "pdf" | "slide" | "word" | (string & {});
```

The editor a format opens in, which is `documentType` of the editor config. Empty for a
format that only comes out of a conversion, such as an image.
