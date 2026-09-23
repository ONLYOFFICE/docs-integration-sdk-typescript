[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / ConvertResponse

# Interface: ConvertResponse

Body of a response from the conversion service.

Either the conversion reports its progress or it reports an `error`, so a body that
carries a code carries nothing else.

## Properties

| Property                              | Type                                                            | Description                                                          |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| <a id="endconvert"></a> `endConvert?` | `boolean`                                                       | Whether the conversion has finished.                                 |
| <a id="error"></a> `error?`           | [`ConversionErrorCode`](../types/client.ConversionErrorCode.md) | -                                                                    |
| <a id="filetype"></a> `fileType?`     | `string`                                                        | Extension of the converted file.                                     |
| <a id="fileurl"></a> `fileUrl?`       | `string`                                                        | URL of the converted file. Present once the conversion has finished. |
| <a id="percent"></a> `percent?`       | `number`                                                        | Progress of the conversion, in percent.                              |
