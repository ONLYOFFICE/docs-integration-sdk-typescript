[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackOptions

# Interface: CallbackOptions

How a callback is checked.

## Properties

| Property                                                         | Type                                                | Description                                                                                                                                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-authorizationheader"></a> `authorizationHeader?` | `string`                                            | Header the token is sent in. Default: `"Authorization"`.                                                                                                                                        |
| <a id="property-authorizationprefix"></a> `authorizationPrefix?` | `string`                                            | Written before the token in that header. Default: `"Bearer "`.                                                                                                                                  |
| <a id="property-verifier"></a> `verifier`                        | [`CallbackVerifier`](CallbackVerifier.md) \| `null` | Checks the token the document server signed the callback with. `null` takes an unsigned callback, for a document server with no secret; a token it carries is then ignored rather than trusted. |
