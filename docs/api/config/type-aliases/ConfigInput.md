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

| Name            | Type                                            | Description                                                                                            |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `document`      | [`ConfigInputDocument`](ConfigInputDocument.md) | The file, as your storage knows it, and the permissions on it.                                         |
| `documentType?` | `never`                                         | Derived from the format of the file, so it can't be given.                                             |
| `events?`       | `never`                                         | Functions, added in the browser where the editor is created, so they can't be given.                   |
| `token?`        | `never`                                         | Written by [DocumentServerConfig.sign](../classes/DocumentServerConfig.md#sign), so it can't be given. |
