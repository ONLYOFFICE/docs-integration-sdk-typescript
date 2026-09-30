[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / StrictConfig

# Interface: StrictConfig

The config [DocumentServerConfig](../classes/DocumentServerConfig.md) builds from a [ConfigInput](../type-aliases/ConfigInput.md), with `document`
and `documentType` always set.

## Extends

- [`SignableConfig`](../type-aliases/SignableConfig.md)

## Properties

| Property                                          | Type                                  | Description                                                              |
| ------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| <a id="property-document"></a> `document`         | `DocumentNormal` & `DocumentEmbedded` | The file, with `fileType` derived from `title`.                          |
| <a id="property-documenttype"></a> `documentType` | `DocumentType`                        | The editor the file opens in, derived from its format, such as `"word"`. |
