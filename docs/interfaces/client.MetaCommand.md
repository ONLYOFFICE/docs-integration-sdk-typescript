[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / MetaCommand

# Interface: MetaCommand

Renames the document in every editor that has it open.

## Extends

- `Command`

## Properties

| Property                    | Type                                     | Description                                                                 |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| <a id="c"></a> `c`          | `"meta"`                                 | -                                                                           |
| <a id="key"></a> `key`      | `string`                                 | Identifier of the document.                                                 |
| <a id="meta"></a> `meta`    | [`DocumentMeta`](client.DocumentMeta.md) | -                                                                           |
| <a id="token"></a> `token?` | `string`                                 | JWT signature of this body. Required once the document server has a secret. |
