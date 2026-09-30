[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigFormat

# Interface: ConfigFormat

The part of a [Format](../../formats/interfaces/Format.md) the config is built from.

## Properties

| Property                                | Modifier   | Type                | Description                                                                                     |
| --------------------------------------- | ---------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| <a id="property-actions"></a> `actions` | `readonly` | readonly `string`[] | What the editors can do with the format, as `/meta/formats` names it: `edit`, `fill` and so on. |
| <a id="property-type"></a> `type`       | `readonly` | `string`            | The editor the format opens in, which becomes `documentType`. Empty when no editor opens it.    |
