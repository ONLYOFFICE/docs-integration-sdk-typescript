[@onlyoffice/docs-integration-sdk](../README.md) / InfoCommand

# Interface: InfoCommand

Asks who has the document open.

## Extends

- `Command`

## Properties

| Property                          | Type     | Description                                                                 |
| --------------------------------- | -------- | --------------------------------------------------------------------------- |
| <a id="c"></a> `c`                | `"info"` | -                                                                           |
| <a id="key"></a> `key`            | `string` | Identifier of the document.                                                 |
| <a id="token"></a> `token?`       | `string` | JWT signature of this body. Required once the document server has a secret. |
| <a id="userdata"></a> `userdata?` | `string` | Passed on to the callback handler, to tell concurrent requests apart.       |
