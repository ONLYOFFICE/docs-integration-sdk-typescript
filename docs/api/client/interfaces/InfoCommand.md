[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / InfoCommand

# Interface: InfoCommand

Asks who has the document open.

## See

[info](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/info/)

## Extends

- `Command`

## Properties

| Property                                   | Type     | Description                                                                                                                                                                                            |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`                | `"info"` | The command.                                                                                                                                                                                           |
| <a id="property-key"></a> `key`            | `string` | Identifier of the document.                                                                                                                                                                            |
| <a id="property-token"></a> `token?`       | `string` | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
| <a id="property-userdata"></a> `userdata?` | `string` | Passed on to the callback handler, to tell concurrent requests apart.                                                                                                                                  |
