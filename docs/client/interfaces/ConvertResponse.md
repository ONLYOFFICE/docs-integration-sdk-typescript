[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertResponse

# Interface: ConvertResponse

Body of a response from the conversion service.

Either the conversion reports its progress or it reports an `error`, so a body that
carries a code carries nothing else.

## Properties

| Property                                       | Type                                                            | Description                                                          |
| ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| <a id="property-endconvert"></a> `endConvert?` | `boolean`                                                       | Whether the conversion has finished.                                 |
| <a id="property-error"></a> `error?`           | [`ConversionErrorCode`](../type-aliases/ConversionErrorCode.md) | -                                                                    |
| <a id="property-filetype"></a> `fileType?`     | `string`                                                        | Extension of the converted file.                                     |
| <a id="property-fileurl"></a> `fileUrl?`       | `string`                                                        | URL of the converted file. Present once the conversion has finished. |
| <a id="property-percent"></a> `percent?`       | `number`                                                        | Progress of the conversion, in percent.                              |
