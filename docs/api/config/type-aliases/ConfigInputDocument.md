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

The file as your storage knows it. [DocumentServerConfig](../classes/DocumentServerConfig.md) derives `fileType` from
`title`, so it can't be given.

## Type Declaration

| Name          | Type                                                  | Description                                                                                               |
| ------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `fileType?`   | `never`                                               | Derived from `title`, so it can't be given.                                                               |
| `key`         | `string`                                              | Identifies this revision of the file. Build it with [buildDocumentKey](../functions/buildDocumentKey.md). |
| `permissions` | [`ConfigInputPermissions`](ConfigInputPermissions.md) | What the user may do with the file. `edit` is required.                                                   |
| `title`       | `string`                                              | Name of the file, extension included, which the editor shows and downloads it under.                      |
| `url`         | `string`                                              | Absolute URL the document server downloads the file from.                                                 |
