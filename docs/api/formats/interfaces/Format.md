[@onlyoffice/docs-integration-sdk](../../README.md) / [formats](../README.md) / Format

# Interface: Format

A file format the document server knows.

## Properties

| Property                                | Type                                                | Description                                                          |
| --------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| <a id="property-actions"></a> `actions` | [`FormatAction`](../type-aliases/FormatAction.md)[] | What the editors can do with it. Empty for a format they never open. |
| <a id="property-convert"></a> `convert` | `string`[]                                          | Extensions it can be converted to, each without the dot.             |
| <a id="property-mime"></a> `mime`       | `string`[]                                          | MIME types it is served under.                                       |
| <a id="property-name"></a> `name`       | `string`                                            | Extension of the format, without the dot, such as `"docx"`.          |
| <a id="property-type"></a> `type`       | [`FormatType`](../type-aliases/FormatType.md)       | -                                                                    |
