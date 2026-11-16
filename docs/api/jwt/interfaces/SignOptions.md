[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / SignOptions

# Interface: SignOptions

Options of one [DocumentServerJwt.sign](../classes/DocumentServerJwt.md#sign) call, over the signer options.

## Properties

| Property                                           | Type                                              | Description                                                                                                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-expiresinsec"></a> `expiresInSec?` | `number` \| `null`                                | The lifetime of this token, instead of the configured one. Validated the same way.                                                                                                                                                          |
| <a id="property-operation"></a> `operation?`       | [`JwtOperation`](../type-aliases/JwtOperation.md) | Written to the `operation` claim, over an `operation` the payload has. The document server refuses a token whose `operation` names another endpoint. The `from-file` endpoints refuse a token without it; the others accept one without it. |
