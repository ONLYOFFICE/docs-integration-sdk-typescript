[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / StrictConfig

# Interface: StrictConfig

A config carrying what the document server requires of it, which is what
[DocumentServerConfig](../classes/DocumentServerConfig.md) builds out of a [ConfigInput](../type-aliases/ConfigInput.md).

## Extends

- [`SignableConfig`](../type-aliases/SignableConfig.md)

## Properties

| Property                                          | Type                                  | Description                                                                                                                            |
| ------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-document"></a> `document`         | `DocumentNormal` & `DocumentEmbedded` | The document section defines the document parameters. **See** https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/      |
| <a id="property-documenttype"></a> `documentType` | `DocumentType`                        | The document type to be opened. **See** https://api.onlyoffice.com/docs/docs-api/usage-api/config/#documenttype **For Type** `desktop` | `mobile` | `embedded` |
