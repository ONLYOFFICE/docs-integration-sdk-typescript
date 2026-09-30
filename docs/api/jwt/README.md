[@onlyoffice/docs-integration-sdk](../README.md) / jwt

# jwt

Signing and checking the tokens the document server exchanges. Imported from
`@onlyoffice/docs-integration-sdk/jwt`.

## Classes

| Class                                             | Description                                                                                                                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DocumentServerJwt](classes/DocumentServerJwt.md) | Signs the tokens the document server expects and verifies the tokens it sends. HMAC comes from WebCrypto, so there are no dependencies.                                                                                      |
| [JwtError](classes/JwtError.md)                   | Thrown by [DocumentServerJwt.verify](classes/DocumentServerJwt.md#verify) and [DocumentServerJwt.verifyHeader](classes/DocumentServerJwt.md#verifyheader) when a token can't be trusted. Reply to such a request with `403`. |

## Interfaces

| Interface                                                | Description                                                                                                                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [JwtOptions](interfaces/JwtOptions.md)                   | Settings of a [DocumentServerJwt](classes/DocumentServerJwt.md), applied to every token it signs or verifies.                                                                                                          |
| [SignOptions](interfaces/SignOptions.md)                 | Options of one [DocumentServerJwt.sign](classes/DocumentServerJwt.md#sign) call, over the signer options.                                                                                                              |
| [VerifyHeaderOptions](interfaces/VerifyHeaderOptions.md) | Options of one [DocumentServerJwt.verifyHeader](classes/DocumentServerJwt.md#verifyheader) call. Set the header and the prefix to the `token.outbox.header` and `token.outbox.prefix` settings of the document server. |
| [VerifyOptions](interfaces/VerifyOptions.md)             | Options of one [DocumentServerJwt.verify](classes/DocumentServerJwt.md#verify) call, over the signer options.                                                                                                          |

## Type Aliases

| Type Alias                                   | Description                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [JwtAlgorithm](type-aliases/JwtAlgorithm.md) | The HMAC algorithms the document server signs with. Use the one it is configured with.                                                                             |
| [JwtErrorKind](type-aliases/JwtErrorKind.md) | Why a token was refused, the discriminant of [JwtError](classes/JwtError.md):                                                                                      |
| [JwtHeaders](type-aliases/JwtHeaders.md)     | The headers of a request: fetch `Headers` or a plain Node headers object. Names are matched in any case; of a header given several times, the first value is read. |
| [JwtOperation](type-aliases/JwtOperation.md) | The endpoint a token is for, written to the `operation` claim:                                                                                                     |
