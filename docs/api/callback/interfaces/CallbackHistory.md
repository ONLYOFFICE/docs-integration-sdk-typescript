[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackHistory

# Interface: CallbackHistory

The changes of the saved document, in the shape the editor's `refreshHistory` takes.

## Properties

| Property                                            | Type                              | Description                                        |
| --------------------------------------------------- | --------------------------------- | -------------------------------------------------- |
| <a id="property-changes"></a> `changes`             | `Record`\<`string`, `unknown`\>[] | The changes, one entry for each.                   |
| <a id="property-serverversion"></a> `serverVersion` | `string`                          | The version of the document server that made them. |
