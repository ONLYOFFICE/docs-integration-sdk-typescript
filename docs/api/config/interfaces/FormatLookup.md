[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / FormatLookup

# Interface: FormatLookup

What finds the format of a file:
[DocumentServerFormats](../../formats/classes/DocumentServerFormats.md) or a lookup of your own.

## Methods

### getFormat()

```ts
getFormat(extension): ConfigFormat | undefined;
```

The format an extension names, or `undefined` for one the server does not know.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

[`ConfigFormat`](ConfigFormat.md) \| `undefined`
