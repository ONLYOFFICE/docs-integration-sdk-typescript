[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertFileRequest

# Type Alias: ConvertFileRequest

```ts
type ConvertFileRequest = Omit<ConvertRequest, "key" | "url"> & {
  key?: string;
};
```

The parameters of [DocumentServerClient.convertFromFile](../classes/DocumentServerClient.md#convertfromfile): those of
[ConvertRequest](../interfaces/ConvertRequest.md) without `url`, since the document is sent in the request.

`title` names the converted file, which the answer carries in `Content-Disposition`. A
`token` must carry `operation: "converter"`.

## Type Declaration

| Name   | Type     | Description                                                                                                                                 |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `key?` | `string` | Identifier of the source document. Without it, the service makes one up for each request, so give one for an `async` conversion you repeat. |
