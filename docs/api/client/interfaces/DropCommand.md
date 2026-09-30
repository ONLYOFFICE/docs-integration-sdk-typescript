[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DropCommand

# Interface: DropCommand

Disconnects users from co-editing, leaving them with view access.

## Extends

- `Command`

## Properties

| Property                             | Type       | Description                                                                                                                                                                                            |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"drop"`   | The command.                                                                                                                                                                                           |
| <a id="property-key"></a> `key`      | `string`   | Identifier of the document.                                                                                                                                                                            |
| <a id="property-token"></a> `token?` | `string`   | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
| <a id="property-users"></a> `users?` | `string`[] | Identifiers of the users to disconnect. Since Docs 8.3 omitting it drops every one of them.                                                                                                            |
