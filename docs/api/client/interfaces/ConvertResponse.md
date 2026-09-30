[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertResponse

# Interface: ConvertResponse

The body of a response from `/converter`: the progress of the conversion, or an `error`
code and nothing else. [DocumentServerClient.convert](../classes/DocumentServerClient.md#convert) throws on the code.

## Properties

| Property                                       | Type                                                            | Description                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| <a id="property-endconvert"></a> `endConvert?` | `boolean`                                                       | Whether the conversion has finished. `fileUrl` comes with it.                                              |
| <a id="property-error"></a> `error?`           | [`ConversionErrorCode`](../type-aliases/ConversionErrorCode.md) | The error code, on a failed conversion. See [ConversionErrorCode](../type-aliases/ConversionErrorCode.md). |
| <a id="property-filetype"></a> `fileType?`     | `string`                                                        | Extension of the converted file.                                                                           |
| <a id="property-fileurl"></a> `fileUrl?`       | `string`                                                        | URL of the converted file. Present once the conversion has finished.                                       |
| <a id="property-percent"></a> `percent?`       | `number`                                                        | Progress of the conversion, in percent.                                                                    |
