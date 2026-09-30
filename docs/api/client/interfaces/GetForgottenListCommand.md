[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / GetForgottenListCommand

# Interface: GetForgottenListCommand

Lists the documents the editors left behind.

## Extends

- `Command`

## Properties

| Property                             | Type                 | Description                                                                                                                                                                                            |
| ------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"getForgottenList"` | The command.                                                                                                                                                                                           |
| <a id="property-token"></a> `token?` | `string`             | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
