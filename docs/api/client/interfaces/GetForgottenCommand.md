[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / GetForgottenCommand

# Interface: GetForgottenCommand

Asks for the URL a forgotten document can be downloaded from.

## Extends

- `Command`

## Properties

| Property                             | Type             | Description                                                                                                                                                                                            |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"getForgotten"` | The command.                                                                                                                                                                                           |
| <a id="property-key"></a> `key`      | `string`         | Identifier of the forgotten document.                                                                                                                                                                  |
| <a id="property-token"></a> `token?` | `string`         | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
