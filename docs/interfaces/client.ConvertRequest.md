[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / ConvertRequest

# Interface: ConvertRequest

Body of a request to the conversion service.

## Properties

| Property                                            | Type                                               | Description                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="async"></a> `async?`                         | `boolean`                                          | Return as soon as the conversion is queued instead of waiting for it. Repeat the same request unchanged to collect the result. Default: `false`. |
| <a id="codepage"></a> `codePage?`                   | `number`                                           | Encoding of a CSV or TXT source document, as a code page number: `1251` Cyrillic, `65001` UTF-8, and so on.                                      |
| <a id="delimiter"></a> `delimiter?`                 | [`CsvDelimiter`](../types/client.CsvDelimiter.md)  | Column separator of a CSV source document.                                                                                                       |
| <a id="documentlayout"></a> `documentLayout?`       | [`DocumentLayout`](client.DocumentLayout.md)       | -                                                                                                                                                |
| <a id="documentrenderer"></a> `documentRenderer?`   | [`DocumentRenderer`](client.DocumentRenderer.md)   | -                                                                                                                                                |
| <a id="filetype"></a> `filetype`                    | `string`                                           | Extension of the source document, without the dot.                                                                                               |
| <a id="key"></a> `key`                              | `string`                                           | Identifier of the source document. A new key forces a new conversion.                                                                            |
| <a id="outputtype"></a> `outputtype`                | `string`                                           | Extension of the target format, or `"ooxml"` or `"odf"` to pick it by family.                                                                    |
| <a id="password"></a> `password?`                   | `string`                                           | Password of a protected source document. The converted file has none.                                                                            |
| <a id="pdf"></a> `pdf?`                             | [`PdfOptions`](client.PdfOptions.md)               | -                                                                                                                                                |
| <a id="region"></a> `region?`                       | `string`                                           | Locale for the currency and date formats of a spreadsheet. Default: `"en-US"`.                                                                   |
| <a id="spreadsheetlayout"></a> `spreadsheetLayout?` | [`SpreadsheetLayout`](client.SpreadsheetLayout.md) | -                                                                                                                                                |
| <a id="thumbnail"></a> `thumbnail?`                 | [`Thumbnail`](client.Thumbnail.md)                 | -                                                                                                                                                |
| <a id="title"></a> `title?`                         | `string`                                           | Name of the converted file, extension included.                                                                                                  |
| <a id="token"></a> `token?`                         | `string`                                           | JWT signature of this body. Required once the document server has a secret.                                                                      |
| <a id="url"></a> `url`                              | `string`                                           | Absolute URL the document server downloads the source document from.                                                                             |
| <a id="watermark"></a> `watermark?`                 | [`Watermark`](client.Watermark.md)                 | -                                                                                                                                                |
