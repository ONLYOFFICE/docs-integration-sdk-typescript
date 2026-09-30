[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / Watermark

# Interface: Watermark

Watermark stamped onto a PDF or image output.

## Properties

| Property                                           | Type                                                  | Description                                                         |
| -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| <a id="property-align"></a> `align?`               | `0` \| `1` \| `4`                                     | Vertical alignment: `0` bottom, `1` center, `4` top.                |
| <a id="property-fill"></a> `fill?`                 | `string` \| [`RgbColor`](../type-aliases/RgbColor.md) | Fill color in RGB, or the URL of an image — a `data:` URL included. |
| <a id="property-height"></a> `height?`             | `number`                                              | Height in millimeters.                                              |
| <a id="property-margins"></a> `margins?`           | readonly `number`[]                                   | Margins around the text, in millimeters.                            |
| <a id="property-paragraphs"></a> `paragraphs?`     | [`WatermarkParagraph`](WatermarkParagraph.md)[]       | The lines of text of the watermark.                                 |
| <a id="property-rotate"></a> `rotate?`             | `number`                                              | Rotation angle in degrees.                                          |
| <a id="property-stroke"></a> `stroke?`             | [`RgbColor`](../type-aliases/RgbColor.md)             | Stroke color in RGB.                                                |
| <a id="property-stroke-width"></a> `stroke-width?` | `number`                                              | Stroke width in millimeters.                                        |
| <a id="property-transparent"></a> `transparent?`   | `number`                                              | Opacity of the watermark, from `0` to `1`.                          |
| <a id="property-type"></a> `type?`                 | `string`                                              | Preset shape geometry, such as `"rect"`.                            |
| <a id="property-width"></a> `width?`               | `number`                                              | Width in millimeters.                                               |
