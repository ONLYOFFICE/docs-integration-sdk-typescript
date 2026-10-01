[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / VersionCommand

# Interface: VersionCommand

Asks for the version of the document server.

## See

[version](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/version/)

## Extends

- `Command`

## Properties

| Property                             | Type        | Description                                                                                                                                                                                            |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"version"` | The command.                                                                                                                                                                                           |
| <a id="property-token"></a> `token?` | `string`    | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
