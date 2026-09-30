[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtOptions

# Interface: JwtOptions

Settings of a [DocumentServerJwt](../classes/DocumentServerJwt.md), applied to every token it signs or verifies.

## Properties

| Property                                                     | Type                                              | Description                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-algorithm"></a> `algorithm?`                 | [`JwtAlgorithm`](../type-aliases/JwtAlgorithm.md) | The algorithm tokens are signed and verified with. Default: `"HS256"`.                                                                                                        |
| <a id="property-clocktolerancesec"></a> `clockToleranceSec?` | `number`                                          | Leeway on `exp` and `nbf` when verifying, for a document server whose clock differs from yours: a whole number of seconds from `0` to `2147483647`. Default: `3`.             |
| <a id="property-expiresinsec"></a> `expiresInSec?`           | `number` \| `null`                                | How long a signed token is valid, written to `exp`: a whole number of seconds from `1` to `2147483647`. `null` leaves `exp` out, and the token never expires. Default: `300`. |
| <a id="property-secret"></a> `secret`                        | `string`                                          | The secret the document server is configured with. Required, not empty.                                                                                                       |
