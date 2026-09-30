[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuilderRequest

# Type Alias: BuilderRequest

```ts
type BuilderRequest = BuildRequest | BuildResultRequest;
```

The body of a request to `/docbuilder`: [BuildRequest](../interfaces/BuildRequest.md) starts a build,
[BuildResultRequest](../interfaces/BuildResultRequest.md) collects an `async` one.
