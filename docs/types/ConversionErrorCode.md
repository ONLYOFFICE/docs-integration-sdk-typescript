[@onlyoffice/docs-integration-sdk](../README.md) / ConversionErrorCode

# Type Alias: ConversionErrorCode

```ts
type ConversionErrorCode = -1 | -2 | -3 | -4 | -5 | -6 | -7 | -8 | -9 | -10 | (number & {});
```

Why a conversion failed:

- `-1` unknown error
- `-2` conversion timeout
- `-3` conversion error
- `-4` error while downloading the source document
- `-5` incorrect password
- `-6` error while accessing the conversion result database
- `-7` input error
- `-8` invalid token
- `-9` the output format is ambiguous and has to be named explicitly
- `-10` size limit exceeded

A code the service does not document stays a number of its own rather than being forced
into the union, so a `switch` over it is never exhaustive.
