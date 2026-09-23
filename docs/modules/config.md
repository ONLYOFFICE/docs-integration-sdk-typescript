[@onlyoffice/docs-integration-sdk](../README.md) / config

# config

The config an editor is opened with, validated and signed. Imported from
`@onlyoffice/docs-integration-sdk/config`.

## Classes

| Class                                                             | Description                                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [DocumentServerConfig](../classes/config.DocumentServerConfig.md) | The config the editor is opened with: validated, normalized and signed with the secret the document server is configured with. |

## Interfaces

| Interface                                                        | Description                                                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ConfigFile](../interfaces/config.ConfigFile.md)                 | A file the editors are to open, as your storage knows it.                                                                                                              |
| [ConfigSigner](../interfaces/config.ConfigSigner.md)             | What signs a config: [DocumentServerJwt](../classes/jwt.DocumentServerJwt.md) or any signer of your own.                                                               |
| [DocumentTypeLookup](../interfaces/config.DocumentTypeLookup.md) | What finds the editor of a file: [DocumentServerFormats](../classes/formats.DocumentServerFormats.md) or a lookup of your own.                                         |
| [StrictConfig](../interfaces/config.StrictConfig.md)             | A config carrying what the document server requires of it, which is what [DocumentServerConfig](../classes/config.DocumentServerConfig.md) validates a loose one into. |

## Type Aliases

| Type Alias                                          | Description                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| [ConfigDocument](../types/config.ConfigDocument.md) | The `document` section of a config.                                            |
| [ConfigEditor](../types/config.ConfigEditor.md)     | The `editorConfig` section of a config.                                        |
| [SignableConfig](../types/config.SignableConfig.md) | A config without the `events` section, which is what is serialized and signed. |

## Functions

| Function                                                    | Description                                                                                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [buildDocumentKey](../functions/config.buildDocumentKey.md) | Builds a document key out of the parts that identify a revision of a file, such as its identifier in your storage and the moment it was last written. |
