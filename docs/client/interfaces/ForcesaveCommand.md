[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ForcesaveCommand

# Interface: ForcesaveCommand

Saves the document being edited without closing it.

## Extends

- `Command`

## Properties

| Property                                   | Type          | Description                                                                 |
| ------------------------------------------ | ------------- | --------------------------------------------------------------------------- |
| <a id="property-c"></a> `c`                | `"forcesave"` | -                                                                           |
| <a id="property-key"></a> `key`            | `string`      | Identifier of the document.                                                 |
| <a id="property-token"></a> `token?`       | `string`      | JWT signature of this body. Required once the document server has a secret. |
| <a id="property-userdata"></a> `userdata?` | `string`      | Passed on to the callback handler, to tell concurrent requests apart.       |
