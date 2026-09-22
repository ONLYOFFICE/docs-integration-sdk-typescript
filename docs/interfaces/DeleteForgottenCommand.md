[@onlyoffice/docs-integration-sdk](../README.md) / DeleteForgottenCommand

# Interface: DeleteForgottenCommand

Removes a document the editors left behind.

## Extends

- `Command`

## Properties

| Property                    | Type                | Description                                                                 |
| --------------------------- | ------------------- | --------------------------------------------------------------------------- |
| <a id="c"></a> `c`          | `"deleteForgotten"` | -                                                                           |
| <a id="key"></a> `key`      | `string`            | Identifier of the forgotten document.                                       |
| <a id="token"></a> `token?` | `string`            | JWT signature of this body. Required once the document server has a secret. |
