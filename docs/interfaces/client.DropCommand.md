[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / DropCommand

# Interface: DropCommand

Disconnects users from co-editing, leaving them with view access.

## Extends

- `Command`

## Properties

| Property                    | Type       | Description                                                                                 |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| <a id="c"></a> `c`          | `"drop"`   | -                                                                                           |
| <a id="key"></a> `key`      | `string`   | Identifier of the document.                                                                 |
| <a id="token"></a> `token?` | `string`   | JWT signature of this body. Required once the document server has a secret.                 |
| <a id="users"></a> `users?` | `string`[] | Identifiers of the users to disconnect. Since Docs 8.3 omitting it drops every one of them. |
