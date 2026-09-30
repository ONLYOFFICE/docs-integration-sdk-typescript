[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / MetaCommand

# Interface: MetaCommand

Renames the document in every editor that has it open.

## Extends

- `Command`

## Properties

| Property                             | Type                              | Description                                                                 |
| ------------------------------------ | --------------------------------- | --------------------------------------------------------------------------- |
| <a id="property-c"></a> `c`          | `"meta"`                          | -                                                                           |
| <a id="property-key"></a> `key`      | `string`                          | Identifier of the document.                                                 |
| <a id="property-meta"></a> `meta`    | [`DocumentMeta`](DocumentMeta.md) | -                                                                           |
| <a id="property-token"></a> `token?` | `string`                          | JWT signature of this body. Required once the document server has a secret. |
