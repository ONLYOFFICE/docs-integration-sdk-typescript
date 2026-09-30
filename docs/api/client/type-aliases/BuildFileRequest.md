[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuildFileRequest

# Type Alias: BuildFileRequest

```ts
type BuildFileRequest = Omit<BuildRequest, "key" | "url">;
```

Starts a build of a script sent along with the request rather than downloaded from a `url`.
