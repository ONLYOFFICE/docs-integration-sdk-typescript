[@onlyoffice/docs-integration-sdk](../README.md) / SpreadsheetLayout

# Interface: SpreadsheetLayout

Layout used when a spreadsheet is converted to PDF or to an image.

At most 1500 pages are produced in a single conversion.

## Properties

| Property                                        | Type                            | Description                                                                    |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| <a id="fittoheight"></a> `fitToHeight?`         | `number`                        | Height of the converted area, in pages. `0` leaves it unbounded. Default: `0`. |
| <a id="fittowidth"></a> `fitToWidth?`           | `number`                        | Width of the converted area, in pages. `0` leaves it unbounded. Default: `0`.  |
| <a id="gridlines"></a> `gridLines?`             | `boolean`                       | Keep the grid lines. Default: `false`.                                         |
| <a id="headings"></a> `headings?`               | `boolean`                       | Keep the row and column headings. Default: `false`.                            |
| <a id="ignoreprintarea"></a> `ignorePrintArea?` | `boolean`                       | Convert the whole sheet rather than its print area. Default: `true`.           |
| <a id="margins"></a> `margins?`                 | [`PageMargins`](PageMargins.md) | -                                                                              |
| <a id="orientation"></a> `orientation?`         | `"landscape"` \| `"portrait"`   | Default: `"portrait"`.                                                         |
| <a id="pagesize"></a> `pageSize?`               | [`PageSize`](PageSize.md)       | -                                                                              |
| <a id="scale"></a> `scale?`                     | `number`                        | Scale of the output, in percent. Default: `100`.                               |
