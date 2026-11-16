[@onlyoffice/docs-integration-sdk](../../README.md) / [jwt](../README.md) / JwtHeaders

# Type Alias: JwtHeaders

```ts
type JwtHeaders = Headers | Readonly<Record<string, string | readonly string[] | undefined>>;
```

The headers of a request: fetch `Headers` or a plain Node headers object. Names are matched
in any case; of a header given several times, the first value is read.
