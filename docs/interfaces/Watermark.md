[@onlyoffice/docs-integration-sdk](../README.md) / Watermark

# Interface: Watermark

Watermark stamped onto a PDF or image output.

## Properties

| Property                                  | Type                                            | Description                                                         |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| <a id="align"></a> `align?`               | `0` \| `1` \| `4`                               | Vertical alignment: `0` bottom, `1` center, `4` top.                |
| <a id="fill"></a> `fill?`                 | `string` \| [`RgbColor`](../types/RgbColor.md)  | Fill color in RGB, or the URL of an image — a `data:` URL included. |
| <a id="height"></a> `height?`             | `number`                                        | Height in millimeters.                                              |
| <a id="margins"></a> `margins?`           | readonly `number`[]                             | Margins around the text, in millimeters.                            |
| <a id="paragraphs"></a> `paragraphs?`     | [`WatermarkParagraph`](WatermarkParagraph.md)[] | -                                                                   |
| <a id="rotate"></a> `rotate?`             | `number`                                        | Rotation angle in degrees.                                          |
| <a id="stroke"></a> `stroke?`             | [`RgbColor`](../types/RgbColor.md)              | Stroke color in RGB.                                                |
| <a id="stroke-width"></a> `stroke-width?` | `number`                                        | Stroke width in millimeters.                                        |
| <a id="transparent"></a> `transparent?`   | `number`                                        | Opacity of the watermark, from `0` to `1`.                          |
| <a id="type"></a> `type?`                 | `string`                                        | Preset shape geometry, such as `"rect"`.                            |
| <a id="width"></a> `width?`               | `number`                                        | Width in millimeters.                                               |
