[@onlyoffice/docs-integration-sdk](../README.md) / config

# config

The config an editor is opened with, validated and signed, and the document key it needs.
Imported from `@onlyoffice/docs-integration-sdk/config`.

## See

[Opening an editor](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/editor.md)

## Classes

| Class                                                   | Description                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ConfigError](classes/ConfigError.md)                   | Thrown by the [DocumentServerConfig](classes/DocumentServerConfig.md) constructor when the config can't be built. The constructor lists every check. |
| [DocumentServerConfig](classes/DocumentServerConfig.md) | The config an editor is opened with. Build it on your server, where the JWT secret is, and pass the result to `DocsAPI.DocEditor` in the browser.    |

## Interfaces

| Interface                                  | Description                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ConfigFormat](interfaces/ConfigFormat.md) | The part of a [Format](../formats/interfaces/Format.md) the config is built from.                                                                                           |
| [ConfigSigner](interfaces/ConfigSigner.md) | Signs a config. [DocumentServerJwt](../jwt/classes/DocumentServerJwt.md) implements it; any object with `sign()` works, such as a signer backed by a key vault.             |
| [FormatLookup](interfaces/FormatLookup.md) | Finds the format of a file. [DocumentServerFormats](../formats/classes/DocumentServerFormats.md) implements it; any object with `getFormat()` works.                        |
| [StrictConfig](interfaces/StrictConfig.md) | The config [DocumentServerConfig](classes/DocumentServerConfig.md) builds from a [ConfigInput](type-aliases/ConfigInput.md), with `document` and `documentType` always set. |

## Type Aliases

| Type Alias                                                       | Description                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ConfigDocument](type-aliases/ConfigDocument.md)                 | The `document` section of a config.                                                                                                                                                               |
| [ConfigEditor](type-aliases/ConfigEditor.md)                     | The `editorConfig` section of a config.                                                                                                                                                           |
| [ConfigErrorKind](type-aliases/ConfigErrorKind.md)               | Why a config was refused, the discriminant of [ConfigError](classes/ConfigError.md):                                                                                                              |
| [ConfigInput](type-aliases/ConfigInput.md)                       | The input of [DocumentServerConfig](classes/DocumentServerConfig.md): the file, the permissions on it and the whole `editorConfig`.                                                               |
| [ConfigInputDocument](type-aliases/ConfigInputDocument.md)       | The file as your storage knows it. [DocumentServerConfig](classes/DocumentServerConfig.md) derives `fileType` from `title`, so it can't be given.                                                 |
| [ConfigInputPermissions](type-aliases/ConfigInputPermissions.md) | The permissions your system grants on the file. `edit` is required: the SDK has no default for whether a file may be changed.                                                                     |
| [ConfigPermissions](type-aliases/ConfigPermissions.md)           | The `document.permissions` section of a config.                                                                                                                                                   |
| [SignableConfig](type-aliases/SignableConfig.md)                 | A config without `events`: what is serialized and signed. Events are functions, so they don't survive `JSON.stringify` and can't be signed. Add them in the browser, where the editor is created. |

## Functions

| Function                                          | Description                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [buildDocumentKey](functions/buildDocumentKey.md) | Builds a document key from the parts that identify one revision of a file, such as the instance of your system, the file ID and the version. |
