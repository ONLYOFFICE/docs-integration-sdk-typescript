[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DeleteForgottenCommand

# Interface: DeleteForgottenCommand

Removes a document the editors left behind.

## Extends

- `Command`

## Properties

| Property                             | Type                | Description                                                                 |
| ------------------------------------ | ------------------- | --------------------------------------------------------------------------- |
| <a id="property-c"></a> `c`          | `"deleteForgotten"` | -                                                                           |
| <a id="property-key"></a> `key`      | `string`            | Identifier of the forgotten document.                                       |
| <a id="property-token"></a> `token?` | `string`            | JWT signature of this body. Required once the document server has a secret. |
