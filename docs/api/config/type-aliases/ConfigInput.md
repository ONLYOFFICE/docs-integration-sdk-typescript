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

Everything your system knows of the editor it opens: the file, the permissions it grants
and the whole `editorConfig`. What the document server decides — `documentType`,
`document.fileType` — is derived by [DocumentServerConfig](../classes/DocumentServerConfig.md), so the type leaves no
room for it, and neither for the `token`, which only [DocumentServerConfig.sign](../classes/DocumentServerConfig.md#sign)
writes.

## Type Declaration

| Name            | Type                                            |
| --------------- | ----------------------------------------------- |
| `document`      | [`ConfigInputDocument`](ConfigInputDocument.md) |
| `documentType?` | `never`                                         |
| `events?`       | `never`                                         |
| `token?`        | `never`                                         |
