[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuilderErrorCode

# Type Alias: BuilderErrorCode

```ts
type BuilderErrorCode = -1 | -2 | -3 | -4 | -6 | -8 | (number & {});
```

Why a build failed:

- `-1` unknown error
- `-2` generation timeout
- `-3` generation error
- `-4` error while downloading the script or a file it opens
- `-6` error while accessing the generation result database
- `-8` invalid token

A code the service doesn't document stays a plain number, so keep a `default` branch in a
`switch` over it.
