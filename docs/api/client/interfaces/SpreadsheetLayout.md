[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / SpreadsheetLayout

# Interface: SpreadsheetLayout

Layout used when a spreadsheet is converted to PDF or to an image.

At most 1500 pages are produced in a single conversion.

## Properties

| Property                                                 | Type                            | Description                                                                    |
| -------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| <a id="property-fittoheight"></a> `fitToHeight?`         | `number`                        | Height of the converted area, in pages. `0` leaves it unbounded. Default: `0`. |
| <a id="property-fittowidth"></a> `fitToWidth?`           | `number`                        | Width of the converted area, in pages. `0` leaves it unbounded. Default: `0`.  |
| <a id="property-gridlines"></a> `gridLines?`             | `boolean`                       | Keep the grid lines. Default: `false`.                                         |
| <a id="property-headings"></a> `headings?`               | `boolean`                       | Keep the row and column headings. Default: `false`.                            |
| <a id="property-ignoreprintarea"></a> `ignorePrintArea?` | `boolean`                       | Convert the whole sheet rather than its print area. Default: `true`.           |
| <a id="property-margins"></a> `margins?`                 | [`PageMargins`](PageMargins.md) | Page margins.                                                                  |
| <a id="property-orientation"></a> `orientation?`         | `"landscape"` \| `"portrait"`   | Page orientation. Default: `"portrait"`.                                       |
| <a id="property-pagesize"></a> `pageSize?`               | [`PageSize`](PageSize.md)       | Page size.                                                                     |
| <a id="property-scale"></a> `scale?`                     | `number`                        | Scale of the output, in percent. Default: `100`.                               |
