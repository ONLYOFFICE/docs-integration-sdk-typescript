[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / FileLocation

# Interface: FileLocation

Path and query of a file the document server keeps, as `getFile()` takes them.

## Properties

| Property                            | Type                           | Description                                                                      |
| ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| <a id="property-path"></a> `path`   | `string`                       | Path of the file, relative to the address the document server is reached at.     |
| <a id="property-query"></a> `query` | `Record`\<`string`, `string`\> | Query the document server signed the location with, such as `md5` and `expires`. |
