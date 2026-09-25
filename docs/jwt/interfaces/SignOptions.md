[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / SignOptions

# Interface: SignOptions

Overrides applied to a single token, on top of the signer options.

## Properties

| Property                                           | Type                                              | Description                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-expiresinsec"></a> `expiresInSec?` | `number` \| `null`                                | Lifetime of this token, in place of the configured one.                                                                                                                                                   |
| <a id="property-operation"></a> `operation?`       | [`JwtOperation`](../type-aliases/JwtOperation.md) | Written to the `operation` claim, in place of one the payload carries. The document server refuses a token whose `operation` names another endpoint, and the `from-file` endpoints refuse one without it. |
