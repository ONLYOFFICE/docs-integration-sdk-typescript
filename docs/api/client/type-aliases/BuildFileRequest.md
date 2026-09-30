[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuildFileRequest

# Type Alias: BuildFileRequest

```ts
type BuildFileRequest = Omit<BuildRequest, "key" | "url">;
```

The parameters of [DocumentServerClient.docbuilderFromFile](../classes/DocumentServerClient.md#docbuilderfromfile): those of
[BuildRequest](../interfaces/BuildRequest.md) without `url`, since the script is sent in the request, and without
`key`, since the service creates one and answers `-3` to a request that has its own. A
`token` must carry `operation: "docbuilder"`.
