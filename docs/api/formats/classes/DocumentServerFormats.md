[@onlyoffice/docs-integration-sdk](../../README.md) / [formats](../README.md) / DocumentServerFormats

# Class: DocumentServerFormats

The formats of `/meta/formats`, indexed by extension: the editor each one opens in, what the
editors can do with it, what it converts to and its MIME types.

Every method takes an extension with or without the dot, or a whole file name, and matches
it in any case: `"docx"`, `".DOCX"` and `"/files/Q3 Report.docx"` are the same lookup. An
extension the server doesn't know gives `undefined`, `false` or an empty list.

The list depends on the version and the license of the document server. An instance holds
one answer and sends no requests, so it works as well with a list you cached. Fetch the list
again to see a format the server has learned since.

## Example

```ts
const formats = new DocumentServerFormats(await client.getFormats());

formats.getDocumentType("report.docx"); // "word"
formats.isEditable("docx"); // true
formats.isConvertibleTo("docx", "pdf"); // true
```

## See

[Server configuration and formats](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/formats.md)

## Constructors

### Constructor

```ts
new DocumentServerFormats(formats): DocumentServerFormats;
```

Indexes the list. When two formats share an extension, the one an editor opens wins over
one no editor opens; otherwise the first one wins.

#### Parameters

| Parameter | Type                                           | Description                                                                                                 |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `formats` | readonly [`Format`](../interfaces/Format.md)[] | The answer of [DocumentServerClient.getFormats()](../../client/classes/DocumentServerClient.md#getformats). |

#### Returns

`DocumentServerFormats`

#### Throws

when `formats` is not an array.

## Properties

| Property                        | Modifier   | Type                                           | Description                                              |
| ------------------------------- | ---------- | ---------------------------------------------- | -------------------------------------------------------- |
| <a id="property-all"></a> `all` | `readonly` | readonly [`Format`](../interfaces/Format.md)[] | Every format of the list, in the server's order, frozen. |

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

How many different extensions the list covers. Can be less than `all.length`, since two
formats may share an extension.

##### Returns

`number`

## Methods

### \[iterator\]()

```ts
iterator: IterableIterator<Format>;
```

Iterates over [DocumentServerFormats.all](#property-all).

#### Returns

`IterableIterator`\<[`Format`](../interfaces/Format.md)\>

---

### can()

```ts
can(extension, action): boolean;
```

Returns whether the editors can do `action` with an extension.

#### Parameters

| Parameter   | Type                                              | Description                                                                 |
| ----------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `extension` | `string`                                          | An extension, with or without the dot, or a file name. Matched in any case. |
| `action`    | [`FormatAction`](../type-aliases/FormatAction.md) | The action, such as `"edit"`.                                               |

#### Returns

`boolean`

---

### getActions()

```ts
getActions(extension): readonly FormatAction[];
```

Returns what the editors can do with an extension. Empty when no editor opens it.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

readonly [`FormatAction`](../type-aliases/FormatAction.md)[]

---

### getConversions()

```ts
getConversions(extension): readonly string[];
```

Returns the extensions an extension converts to, without the dot, as `outputtype` of a
conversion takes them. Empty when the server doesn't convert it.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

readonly `string`[]

---

### getDocumentType()

```ts
getDocumentType(extension): FormatType | undefined;
```

Returns the editor an extension opens in, which is `documentType` of the editor config.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

[`FormatType`](../type-aliases/FormatType.md) \| `undefined`

The editor, or `undefined` both when the server doesn't know the extension and
when no editor opens it, such as an image or `zip`.

---

### getExtensions()

```ts
getExtensions(): readonly string[];
```

Returns every extension the list covers, without the dot, in the server's order.

#### Returns

readonly `string`[]

---

### getFormat()

```ts
getFormat(extension): Format | undefined;
```

Returns the format of an extension, or `undefined` when the server doesn't know it.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

[`Format`](../interfaces/Format.md) \| `undefined`

---

### getFormatsByMime()

```ts
getFormatsByMime(mime): readonly Format[];
```

Returns the formats served under a MIME type, matched in any case.

#### Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| `mime`    | `string` | A MIME type, such as `"application/pdf"`. |

#### Returns

readonly [`Format`](../interfaces/Format.md)[]

---

### getFormatsByType()

```ts
getFormatsByType(type): readonly Format[];
```

Returns the formats one editor opens, or, for `""`, those that only come out of a conversion.

#### Parameters

| Parameter | Type                                          | Description                            |
| --------- | --------------------------------------------- | -------------------------------------- |
| `type`    | [`FormatType`](../type-aliases/FormatType.md) | The editor, such as `"word"`, or `""`. |

#### Returns

readonly [`Format`](../interfaces/Format.md)[]

---

### getMimes()

```ts
getMimes(extension): readonly string[];
```

Returns the MIME types an extension is served under.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

readonly `string`[]

---

### hasFormat()

```ts
hasFormat(extension): boolean;
```

Returns whether the server knows the extension.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isAutoConvertable()

```ts
isAutoConvertable(extension): boolean;
```

Returns whether the editors convert it on open, like the legacy `doc`: action `"auto-convert"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isCommentable()

```ts
isCommentable(extension): boolean;
```

Returns whether the editors open it for commenting: action `"comment"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isConvertibleTo()

```ts
isConvertibleTo(from, to): boolean;
```

Returns whether the conversion API converts `from` into `to`. Both are matched like any
extension.

#### Parameters

| Parameter | Type     | Description                                |
| --------- | -------- | ------------------------------------------ |
| `from`    | `string` | The extension or file name converted from. |
| `to`      | `string` | The extension converted to.                |

#### Returns

`boolean`

---

### isEditable()

```ts
isEditable(extension): boolean;
```

Returns whether the editors edit it and save it in its own format: action `"edit"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isEncryptable()

```ts
isEncryptable(extension): boolean;
```

Returns whether the editors open it behind a password: action `"encrypt"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isFillable()

```ts
isFillable(extension): boolean;
```

Returns whether it is a form the editors fill in: action `"fill"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isLossyEditable()

```ts
isLossyEditable(extension): boolean;
```

Returns whether editing it loses what the format can't store, like `rtf`: action
`"lossy-edit"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isOpenable()

```ts
isOpenable(extension): boolean;
```

Returns whether any editor opens the extension, in any mode: the format has a `type`.
Its actions are not checked.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isReviewable()

```ts
isReviewable(extension): boolean;
```

Returns whether the editors open it for reviewing: action `"review"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`

---

### isViewable()

```ts
isViewable(extension): boolean;
```

Returns whether the editors open the extension for viewing: action `"view"`.

#### Parameters

| Parameter   | Type     | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `extension` | `string` | An extension, with or without the dot, or a file name. Matched in any case. |

#### Returns

`boolean`
