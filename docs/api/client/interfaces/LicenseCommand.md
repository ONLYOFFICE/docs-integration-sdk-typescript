[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / LicenseCommand

# Interface: LicenseCommand

Asks for the license and for the quota spent against it.

## Extends

- `Command`

## Properties

| Property                             | Type        | Description                                                                                                                                                                                            |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-c"></a> `c`          | `"license"` | The command.                                                                                                                                                                                           |
| <a id="property-token"></a> `token?` | `string`    | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
