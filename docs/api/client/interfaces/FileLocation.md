[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / FileLocation

# Interface: FileLocation

The path and the query of a file, as [DocumentServerClient.getFile](../classes/DocumentServerClient.md#getfile) takes them.

## Properties

| Property                            | Type                           | Description                                                                     |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| <a id="property-path"></a> `path`   | `string`                       | The path of the file, relative to the address the client reaches the server at. |
| <a id="property-query"></a> `query` | `Record`\<`string`, `string`\> | The query the document server signed the URL with, such as `md5` and `expires`. |
