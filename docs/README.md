# Documentation

New here? Start with the [quick start](../README.md#quick-start).

## Guides

| Guide                                                 | Covers                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| [Opening an editor](guides/editor.md)                 | `DocumentServerConfig`, permissions, signing, document keys   |
| [Handling callbacks](guides/callback.md)              | `DocumentServerCallback`, events, saving, replying            |
| [JWT](guides/jwt.md)                                  | `DocumentServerJwt`: signing and verifying tokens             |
| [Converting documents](guides/conversion.md)          | `convert()`, `convertFromFile()`                              |
| [Commands](guides/commands.md)                        | `command()`: `info`, `forcesave`, `drop` and the rest         |
| [Document builder](guides/document-builder.md)        | `docbuilder()`, `docbuilderFromFile()`                        |
| [Downloading files](guides/files.md)                  | `getFile()`, `splitFileUrl()`                                 |
| [Server configuration and formats](guides/formats.md) | `getConfig()`, `getFormats()`, `DocumentServerFormats`        |
| [Errors](guides/errors.md)                            | the error classes and how to tell them apart                  |
| [Client options](guides/client.md)                    | options, per-request options, the raw client, subpath imports |

## API reference

[api/](api/README.md) lists every export, generated from the source with
[TypeDoc](https://typedoc.org). Look up a single field or method there.
