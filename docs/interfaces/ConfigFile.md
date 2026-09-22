[@onlyoffice/docs-integration-sdk](../README.md) / ConfigFile

# Interface: ConfigFile

A file the editors are to open, as your storage knows it.

## Properties

| Property                   | Type     | Description                                                                                        |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| <a id="key"></a> `key`     | `string` | Identifier of this revision of the file. See [buildDocumentKey](../functions/buildDocumentKey.md). |
| <a id="title"></a> `title` | `string` | Name of the file, extension included, which the editor shows and downloads it under.               |
| <a id="url"></a> `url`     | `string` | Absolute URL the document server downloads the file from.                                          |
