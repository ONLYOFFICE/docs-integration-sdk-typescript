[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtErrorKind

# Type Alias: JwtErrorKind

```ts
type JwtErrorKind = "algorithm" | "expired" | "malformed" | "missing" | "premature" | "signature";
```

Why a token was refused, the discriminant of [JwtError](../classes/JwtError.md):

- `"malformed"`: not a valid JWT;
- `"algorithm"`: the token names another algorithm than the configured one;
- `"signature"`: the signature doesn't match the secret;
- `"expired"`: `exp` has passed;
- `"premature"`: `nbf` has not come yet;
- `"missing"`: the request header carries no token.
