[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / FormatLookup

# Interface: FormatLookup

Finds the format of a file. [DocumentServerFormats](../../formats/classes/DocumentServerFormats.md)
implements it; any object with `getFormat()` works.

## Methods

### getFormat()

```ts
getFormat(extension): ConfigFormat | undefined;
```

Returns the format of an extension, or `undefined` when the document server doesn't know it.

#### Parameters

| Parameter   | Type     | Description                                                         |
| ----------- | -------- | ------------------------------------------------------------------- |
| `extension` | `string` | The extension, in lower case and without the dot, such as `"docx"`. |

#### Returns

[`ConfigFormat`](ConfigFormat.md) \| `undefined`
