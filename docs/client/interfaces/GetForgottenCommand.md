[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / GetForgottenCommand

# Interface: GetForgottenCommand

Asks for the URL a forgotten document can be downloaded from.

## Extends

- `Command`

## Properties

| Property                             | Type             | Description                                                                 |
| ------------------------------------ | ---------------- | --------------------------------------------------------------------------- |
| <a id="property-c"></a> `c`          | `"getForgotten"` | -                                                                           |
| <a id="property-key"></a> `key`      | `string`         | Identifier of the forgotten document.                                       |
| <a id="property-token"></a> `token?` | `string`         | JWT signature of this body. Required once the document server has a secret. |
