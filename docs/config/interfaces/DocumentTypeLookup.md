[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / DocumentTypeLookup

# Interface: DocumentTypeLookup

What finds the editor of a file:
[DocumentServerFormats](../../formats/classes/DocumentServerFormats.md) or a lookup of your own.

## Methods

### getDocumentType()

```ts
getDocumentType(extension): string | undefined;
```

The editor the extension opens in, or `undefined` or the empty string for none.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`string` \| `undefined`
