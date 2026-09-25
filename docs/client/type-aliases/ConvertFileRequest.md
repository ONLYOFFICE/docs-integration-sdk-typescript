[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertFileRequest

# Type Alias: ConvertFileRequest

```ts
type ConvertFileRequest = Omit<ConvertRequest, "key" | "url"> & {
  key?: string;
};
```

Body of a request to convert a document sent along with it, rather than one the
document server downloads from `url`.

`title` names the converted file, which the answer carries in its `Content-Disposition`.

## Type Declaration

| Name   | Type     | Description                                                                                                                                           |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key?` | `string` | Identifier of the source document. The service makes one up when it is left out, which leaves an `async` conversion nothing to be asked for again by. |
