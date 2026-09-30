[@onlyoffice/docs-integration-sdk](../README.md) / formats

# formats

The formats a document server knows, looked up by extension. Imported from
`@onlyoffice/docs-integration-sdk/formats`.

## Classes

| Class                                                     | Description                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [DocumentServerFormats](classes/DocumentServerFormats.md) | The formats of `/meta/formats`, indexed by extension: the editor each one opens in, what the editors can do with it, what it converts to and its MIME types. |

## Interfaces

| Interface                      | Description                              |
| ------------------------------ | ---------------------------------------- |
| [Format](interfaces/Format.md) | A file format the document server knows. |

## Type Aliases

| Type Alias                                   | Description                                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [FormatAction](type-aliases/FormatAction.md) | Something the editors can do with a format:                                                                                                           |
| [FormatType](type-aliases/FormatType.md)     | The editor a format opens in, which is `documentType` of the editor config. Empty for a format that only comes out of a conversion, such as an image. |
