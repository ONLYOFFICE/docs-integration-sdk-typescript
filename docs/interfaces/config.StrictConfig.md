[@onlyoffice/docs-integration-sdk](../README.md) / [config](../modules/config.md) / StrictConfig

# Interface: StrictConfig

A config carrying what the document server requires of it, which is what
[DocumentServerConfig](../classes/config.DocumentServerConfig.md) validates a loose one into.

## Extends

- [`SignableConfig`](../types/config.SignableConfig.md)

## Properties

| Property                                 | Type                                  | Description                                                                                                                            |
| ---------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="document"></a> `document`         | `DocumentNormal` & `DocumentEmbedded` | The document section defines the document parameters. **See** https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/      |
| <a id="documenttype"></a> `documentType` | `DocumentType`                        | The document type to be opened. **See** https://api.onlyoffice.com/docs/docs-api/usage-api/config/#documenttype **For Type** `desktop` | `mobile` | `embedded` |
