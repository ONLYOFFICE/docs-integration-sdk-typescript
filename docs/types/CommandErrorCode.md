[@onlyoffice/docs-integration-sdk](../README.md) / CommandErrorCode

# Type Alias: CommandErrorCode

```ts
type CommandErrorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | (number & {});
```

Why a command failed:

- `0` no error
- `1` the document key is missing or too long
- `2` the callback url is incorrect
- `3` internal server error
- `4` nothing had changed since the last save, so `forcesave` did nothing
- `5` the command is unknown
- `6` invalid token

A code the service does not document stays a number of its own rather than being forced
into the union, so a `switch` over it is never exhaustive.
