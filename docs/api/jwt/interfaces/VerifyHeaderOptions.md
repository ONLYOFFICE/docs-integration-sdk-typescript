[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / VerifyHeaderOptions

# Interface: VerifyHeaderOptions

Options of one [DocumentServerJwt.verifyHeader](../classes/DocumentServerJwt.md#verifyheader) call. Set the header and the prefix to
the `token.outbox.header` and `token.outbox.prefix` settings of the document server.

## Extends

- [`VerifyOptions`](VerifyOptions.md)

## Properties

| Property                                                         | Type     | Description                                                                                |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| <a id="property-authorizationheader"></a> `authorizationHeader?` | `string` | The header the token is read from. Default: `"Authorization"`.                             |
| <a id="property-authorizationprefix"></a> `authorizationPrefix?` | `string` | What comes before the token in that header. `""` reads a bare token. Default: `"Bearer "`. |
| <a id="property-clocktolerancesec"></a> `clockToleranceSec?`     | `number` | The leeway for this token, instead of the configured one. Validated the same way.          |
