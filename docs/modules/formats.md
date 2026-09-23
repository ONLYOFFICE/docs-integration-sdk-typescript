[@onlyoffice/docs-integration-sdk](../README.md) / formats

# formats

The formats a document server knows, looked up by extension. Imported from
`@onlyoffice/docs-integration-sdk/formats`.

## Classes

| Class                                                                | Description                                                                                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [DocumentServerFormats](../classes/formats.DocumentServerFormats.md) | The formats of `/meta/formats`, indexed by extension: what each one opens in, what the editors may do with it, what it converts to and what it is served as. |

## Interfaces

| Interface                                 | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| [Format](../interfaces/formats.Format.md) | A file format the document server knows. |

## Type Aliases

| Type Alias                                       | Description                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [FormatAction](../types/formats.FormatAction.md) | Something the editors can do with a format.                                                                         |
| [FormatType](../types/formats.FormatType.md)     | Editor a format opens in, or the empty string for one that is only ever produced by a conversion, such as an image. |
