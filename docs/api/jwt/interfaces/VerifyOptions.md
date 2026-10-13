[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / VerifyOptions

# Interface: VerifyOptions

Options of one [DocumentServerJwt.verify](../classes/DocumentServerJwt.md#verify) or [DocumentServerJwt.verifyHeader](../classes/DocumentServerJwt.md#verifyheader)
call, over the signer options.

## Properties

| Property                                                     | Type                                              | Description                                                                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-clocktolerancesec"></a> `clockToleranceSec?` | `number`                                          | The leeway for this token, instead of the configured one. Validated the same way.                                                                                       |
| <a id="property-operation"></a> `operation?`                 | [`JwtOperation`](../type-aliases/JwtOperation.md) | The request the token must be for. A token whose `operation` claim is another value is refused; a token without the claim, as older document servers send, is accepted. |
