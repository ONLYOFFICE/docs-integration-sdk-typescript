[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DropCommand

# Interface: DropCommand

Disconnects users from co-editing, leaving them with view access.

## Extends

- `Command`

## Properties

| Property                             | Type       | Description                                                                                 |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| <a id="property-c"></a> `c`          | `"drop"`   | -                                                                                           |
| <a id="property-key"></a> `key`      | `string`   | Identifier of the document.                                                                 |
| <a id="property-token"></a> `token?` | `string`   | JWT signature of this body. Required once the document server has a secret.                 |
| <a id="property-users"></a> `users?` | `string`[] | Identifiers of the users to disconnect. Since Docs 8.3 omitting it drops every one of them. |
