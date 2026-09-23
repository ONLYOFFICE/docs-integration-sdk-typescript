[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtOptions

# Interface: JwtOptions

Settings of a signer, applied to every token it makes.

## Properties

| Property                                                     | Type                                              | Description                                                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-algorithm"></a> `algorithm?`                 | [`JwtAlgorithm`](../type-aliases/JwtAlgorithm.md) | Algorithm the token is signed with. Default: `"HS256"`.                                                                                                             |
| <a id="property-clocktolerancesec"></a> `clockToleranceSec?` | `number`                                          | Leeway on `exp` and `nbf`, in whole seconds from `0` to `2147483647`, for a document server whose clock runs apart from ours. Default: `0`.                         |
| <a id="property-expiresinsec"></a> `expiresInSec?`           | `number` \| `null`                                | How long a token stays valid, in whole seconds from `1` to `2147483647`, written to `exp`. `null` leaves the claim out and the token never expires. Default: `300`. |
| <a id="property-secret"></a> `secret`                        | `string`                                          | Secret the document server is configured with. Required, and not empty.                                                                                             |
