[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / VerifyHeaderOptions

# Interface: VerifyHeaderOptions

Where [DocumentServerJwt.verifyHeader](../classes/DocumentServerJwt.md#verifyheader) finds the token, on top of the check.

## Extends

- [`VerifyOptions`](VerifyOptions.md)

## Properties

| Property                                                         | Type     | Description                                                    |
| ---------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| <a id="property-authorizationheader"></a> `authorizationHeader?` | `string` | Header the token is sent in. Default: `"Authorization"`.       |
| <a id="property-authorizationprefix"></a> `authorizationPrefix?` | `string` | Written before the token in that header. Default: `"Bearer "`. |
| <a id="property-clocktolerancesec"></a> `clockToleranceSec?`     | `number` | Leeway for this token, in place of the configured one.         |
