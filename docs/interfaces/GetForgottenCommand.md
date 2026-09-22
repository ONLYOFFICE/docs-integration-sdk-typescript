[@onlyoffice/docs-integration-sdk](../README.md) / GetForgottenCommand

# Interface: GetForgottenCommand

Asks for the URL a forgotten document can be downloaded from.

## Extends

- `Command`

## Properties

| Property                    | Type             | Description                                                                 |
| --------------------------- | ---------------- | --------------------------------------------------------------------------- |
| <a id="c"></a> `c`          | `"getForgotten"` | -                                                                           |
| <a id="key"></a> `key`      | `string`         | Identifier of the forgotten document.                                       |
| <a id="token"></a> `token?` | `string`         | JWT signature of this body. Required once the document server has a secret. |
