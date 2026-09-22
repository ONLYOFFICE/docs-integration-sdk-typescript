[@onlyoffice/docs-integration-sdk](../README.md) / Thumbnail

# Interface: Thumbnail

Settings for an image output format: BMP, GIF, JPG or PNG.

## Properties

| Property                      | Type              | Description                                                                                                                                            |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="aspect"></a> `aspect?` | `0` \| `1` \| `2` | How the page is fitted into the frame: `0` stretches it, `1` keeps the aspect ratio, `2` ignores width and height and renders at 96 dpi. Default: `2`. |
| <a id="first"></a> `first?`   | `boolean`         | Render only the first page rather than every page. Default: `true`.                                                                                    |
| <a id="height"></a> `height?` | `number`          | Height in pixels. Default: `100`.                                                                                                                      |
| <a id="width"></a> `width?`   | `number`          | Width in pixels. Default: `100`.                                                                                                                       |
