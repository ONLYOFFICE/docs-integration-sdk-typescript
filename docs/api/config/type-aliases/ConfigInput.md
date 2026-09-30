[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigInput

# Type Alias: ConfigInput

```ts
type ConfigInput = Omit<SignableConfig, "document" | "documentType" | "token"> & {
  document: ConfigInputDocument;
  documentType?: never;
  events?: never;
  token?: never;
};
```

The input of [DocumentServerConfig](../classes/DocumentServerConfig.md): the file, the permissions on it and the whole
`editorConfig`.

Four fields can't be given: `documentType` and `document.fileType` are derived from the
format, [DocumentServerConfig.sign](../classes/DocumentServerConfig.md#sign) writes `token`, and `events` are added in the
browser.

## Type Declaration

| Name            | Type                                            |
| --------------- | ----------------------------------------------- |
| `document`      | [`ConfigInputDocument`](ConfigInputDocument.md) |
| `documentType?` | `never`                                         |
| `events?`       | `never`                                         |
| `token?`        | `never`                                         |
