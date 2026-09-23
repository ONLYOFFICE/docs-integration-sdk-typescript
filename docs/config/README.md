[@onlyoffice/docs-integration-sdk](../README.md) / config

# config

The config an editor is opened with, validated and signed. Imported from
`@onlyoffice/docs-integration-sdk/config`.

## Classes

| Class                                                   | Description                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [DocumentServerConfig](classes/DocumentServerConfig.md) | The config the editor is opened with: validated, normalized and signed with the secret the document server is configured with. |

## Interfaces

| Interface                                              | Description                                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ConfigFile](interfaces/ConfigFile.md)                 | A file the editors are to open, as your storage knows it.                                                                                                    |
| [ConfigSigner](interfaces/ConfigSigner.md)             | What signs a config: [DocumentServerJwt](../jwt/classes/DocumentServerJwt.md) or any signer of your own.                                                     |
| [DocumentTypeLookup](interfaces/DocumentTypeLookup.md) | What finds the editor of a file: [DocumentServerFormats](../formats/classes/DocumentServerFormats.md) or a lookup of your own.                               |
| [StrictConfig](interfaces/StrictConfig.md)             | A config carrying what the document server requires of it, which is what [DocumentServerConfig](classes/DocumentServerConfig.md) validates a loose one into. |

## Type Aliases

| Type Alias                                       | Description                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| [ConfigDocument](type-aliases/ConfigDocument.md) | The `document` section of a config.                                            |
| [ConfigEditor](type-aliases/ConfigEditor.md)     | The `editorConfig` section of a config.                                        |
| [SignableConfig](type-aliases/SignableConfig.md) | A config without the `events` section, which is what is serialized and signed. |

## Functions

| Function                                          | Description                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [buildDocumentKey](functions/buildDocumentKey.md) | Builds a document key out of the parts that identify a revision of a file, such as its identifier in your storage and the moment it was last written. |
