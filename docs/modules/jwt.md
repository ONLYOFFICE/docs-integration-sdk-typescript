[@onlyoffice/docs-integration-sdk](../README.md) / jwt

# jwt

Signing and checking the tokens the document server exchanges. Imported from
`@onlyoffice/docs-integration-sdk/jwt`.

## Classes

| Class                                                    | Description                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [DocumentServerJwt](../classes/jwt.DocumentServerJwt.md) | Signs the tokens the document server expects, over the secret it is configured with.                                      |
| [JwtError](../classes/jwt.JwtError.md)                   | A token that could not be trusted: malformed, signed with another algorithm or another secret, expired, or not valid yet. |

## Interfaces

| Interface                                           | Description                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| [JwtOptions](../interfaces/jwt.JwtOptions.md)       | Settings of a signer, applied to every token it makes.             |
| [SignOptions](../interfaces/jwt.SignOptions.md)     | Overrides applied to a single token, on top of the signer options. |
| [VerifyOptions](../interfaces/jwt.VerifyOptions.md) | Overrides applied to a single check, on top of the signer options. |

## Type Aliases

| Type Alias                                   | Description                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [JwtAlgorithm](../types/jwt.JwtAlgorithm.md) | The HMAC algorithms the document server signs with.                                      |
| [JwtErrorKind](../types/jwt.JwtErrorKind.md) | Why a token was refused, and the discriminant of [JwtError](../classes/jwt.JwtError.md). |
