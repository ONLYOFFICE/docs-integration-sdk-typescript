[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigInputDocument

# Type Alias: ConfigInputDocument

```ts
type ConfigInputDocument = Omit<
  ConfigDocument,
  "fileType" | "key" | "permissions" | "title" | "url"
> & {
  fileType?: never;
  key: string;
  permissions: ConfigInputPermissions;
  title: string;
  url: string;
};
```

The file as your storage knows it. `fileType` is read off `title` by
[DocumentServerConfig](../classes/DocumentServerConfig.md), so the type leaves no room for it.

## Type Declaration

| Name          | Type                                                  | Description                                                                                        |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `fileType?`   | `never`                                               | -                                                                                                  |
| `key`         | `string`                                              | Identifier of this revision of the file. See [buildDocumentKey](../functions/buildDocumentKey.md). |
| `permissions` | [`ConfigInputPermissions`](ConfigInputPermissions.md) | -                                                                                                  |
| `title`       | `string`                                              | Name of the file, extension included, which the editor shows and downloads it under.               |
| `url`         | `string`                                              | Absolute URL the document server downloads the file from.                                          |
