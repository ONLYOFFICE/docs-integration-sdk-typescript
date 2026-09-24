[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigFormat

# Interface: ConfigFormat

What the config takes of a format: the part of a [Format](../../formats/interfaces/Format.md) of
`/meta/formats` it is built out of.

## Properties

| Property                                | Modifier   | Type                | Description                                                                     |
| --------------------------------------- | ---------- | ------------------- | ------------------------------------------------------------------------------- |
| <a id="property-actions"></a> `actions` | `readonly` | readonly `string`[] | What the editors can do with it.                                                |
| <a id="property-type"></a> `type`       | `readonly` | `string`            | Editor it opens in, which becomes `documentType`, or the empty string for none. |
