[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigFile

# Interface: ConfigFile

A file the editors are to open, as your storage knows it.

## Properties

| Property                            | Type     | Description                                                                                        |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| <a id="property-key"></a> `key`     | `string` | Identifier of this revision of the file. See [buildDocumentKey](../functions/buildDocumentKey.md). |
| <a id="property-title"></a> `title` | `string` | Name of the file, extension included, which the editor shows and downloads it under.               |
| <a id="property-url"></a> `url`     | `string` | Absolute URL the document server downloads the file from.                                          |
