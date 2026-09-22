[@onlyoffice/docs-integration-sdk](../README.md) / Format

# Interface: Format

A file format the document server knows.

## Properties

| Property                       | Type                                         | Description                                                          |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------------- |
| <a id="actions"></a> `actions` | [`FormatAction`](../types/FormatAction.md)[] | What the editors can do with it. Empty for a format they never open. |
| <a id="convert"></a> `convert` | `string`[]                                   | Extensions it can be converted to, each without the dot.             |
| <a id="mime"></a> `mime`       | `string`[]                                   | MIME types it is served under.                                       |
| <a id="name"></a> `name`       | `string`                                     | Extension of the format, without the dot, such as `"docx"`.          |
| <a id="type"></a> `type`       | [`FormatType`](../types/FormatType.md)       | -                                                                    |
