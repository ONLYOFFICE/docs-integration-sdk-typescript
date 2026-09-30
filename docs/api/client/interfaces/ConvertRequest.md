[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertRequest

# Interface: ConvertRequest

Body of a request to the conversion service.

## Properties

| Property                                                     | Type                                              | Description                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-async"></a> `async?`                         | `boolean`                                         | Return as soon as the conversion is queued instead of waiting for it. Repeat the same request unchanged to collect the result. Default: `false`. |
| <a id="property-codepage"></a> `codePage?`                   | `number`                                          | Encoding of a CSV or TXT source document, as a code page number: `1251` Cyrillic, `65001` UTF-8, and so on.                                      |
| <a id="property-delimiter"></a> `delimiter?`                 | [`CsvDelimiter`](../type-aliases/CsvDelimiter.md) | Column separator of a CSV source document.                                                                                                       |
| <a id="property-documentlayout"></a> `documentLayout?`       | [`DocumentLayout`](DocumentLayout.md)             | -                                                                                                                                                |
| <a id="property-documentrenderer"></a> `documentRenderer?`   | [`DocumentRenderer`](DocumentRenderer.md)         | -                                                                                                                                                |
| <a id="property-filetype"></a> `filetype`                    | `string`                                          | Extension of the source document, without the dot.                                                                                               |
| <a id="property-key"></a> `key`                              | `string`                                          | Identifier of the source document. A new key forces a new conversion.                                                                            |
| <a id="property-outputtype"></a> `outputtype`                | `string`                                          | Extension of the target format, or `"ooxml"` or `"odf"` to pick it by family.                                                                    |
| <a id="property-password"></a> `password?`                   | `string`                                          | Password of a protected source document. The converted file has none.                                                                            |
| <a id="property-pdf"></a> `pdf?`                             | [`PdfOptions`](PdfOptions.md)                     | -                                                                                                                                                |
| <a id="property-region"></a> `region?`                       | `string`                                          | Locale for the currency and date formats of a spreadsheet. Default: `"en-US"`.                                                                   |
| <a id="property-spreadsheetlayout"></a> `spreadsheetLayout?` | [`SpreadsheetLayout`](SpreadsheetLayout.md)       | -                                                                                                                                                |
| <a id="property-thumbnail"></a> `thumbnail?`                 | [`Thumbnail`](Thumbnail.md)                       | -                                                                                                                                                |
| <a id="property-title"></a> `title?`                         | `string`                                          | Name of the converted file, extension included.                                                                                                  |
| <a id="property-token"></a> `token?`                         | `string`                                          | JWT signature of this body. Required once the document server has a secret.                                                                      |
| <a id="property-url"></a> `url`                              | `string`                                          | Absolute URL the document server downloads the source document from.                                                                             |
| <a id="property-watermark"></a> `watermark?`                 | [`Watermark`](Watermark.md)                       | -                                                                                                                                                |
