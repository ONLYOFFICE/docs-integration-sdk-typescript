[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / MetaCommand

# Interface: MetaCommand

Renames the document in every editor that has it open.

## See

[meta](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/meta/)

## Extends

- `Command`

## Properties

| Property                             | Type                              | Description                                                                                                                                                                                            |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"meta"`                          | The command.                                                                                                                                                                                           |
| <a id="property-key"></a> `key`      | `string`                          | Identifier of the document.                                                                                                                                                                            |
| <a id="property-meta"></a> `meta`    | [`DocumentMeta`](DocumentMeta.md) | The new metadata.                                                                                                                                                                                      |
| <a id="property-token"></a> `token?` | `string`                          | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
