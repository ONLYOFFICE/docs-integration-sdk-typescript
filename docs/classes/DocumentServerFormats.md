[@onlyoffice/docs-integration-sdk](../README.md) / DocumentServerFormats

# Class: DocumentServerFormats

The formats of `/meta/formats`, indexed by extension: what each one opens in, what the
editors may do with it, what it converts to and what it is served as.

The list changes with the version of the document server and with its licence, so it is
read from the server rather than carried here. One instance stands for one such answer;
get a fresh list to see a format the server has since learned.

## Constructors

### Constructor

```ts
new DocumentServerFormats(formats): DocumentServerFormats;
```

#### Parameters

| Parameter | Type                                           | Description                                                                          |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `formats` | readonly [`Format`](../interfaces/Format.md)[] | The answer of [DocumentServerClient.getFormats](DocumentServerClient.md#getformats). |

#### Returns

`DocumentServerFormats`

#### Throws

when it is not an array.

## Properties

| Property               | Modifier   | Type                                           | Description                                                              |
| ---------------------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| <a id="all"></a> `all` | `readonly` | readonly [`Format`](../interfaces/Format.md)[] | Every format of the list, in the order the server gave them, and frozen. |

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

How many extensions the list covers.

##### Returns

`number`

## Methods

### \[iterator\]()

```ts
iterator: IterableIterator<Format>;
```

#### Returns

`IterableIterator`\<[`Format`](../interfaces/Format.md)\>

---

### can()

```ts
can(extension, action): boolean;
```

Whether the editors may do that with an extension.

#### Parameters

| Parameter   | Type                                       |
| ----------- | ------------------------------------------ |
| `extension` | `string`                                   |
| `action`    | [`FormatAction`](../types/FormatAction.md) |

#### Returns

`boolean`

---

### getActions()

```ts
getActions(extension): readonly FormatAction[];
```

What the editors may do with an extension. Empty for one they never open.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

readonly [`FormatAction`](../types/FormatAction.md)[]

---

### getConversions()

```ts
getConversions(extension): readonly string[];
```

The extensions an extension converts to, each without the dot, as the conversion API
takes them in `outputtype`. Empty for a format the server does not convert.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

readonly `string`[]

---

### getDocumentType()

```ts
getDocumentType(extension): FormatType | undefined;
```

The editor an extension opens in, which is the `documentType` the editor config takes.

`undefined` both for an extension the server does not know and for one no editor
opens, such as an image or `zip` that a conversion only ever produces.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

[`FormatType`](../types/FormatType.md) \| `undefined`

---

### getExtensions()

```ts
getExtensions(): readonly string[];
```

Every extension the list covers, without the dots, in the order the server gave them.

#### Returns

readonly `string`[]

---

### getFormat()

```ts
getFormat(extension): Format | undefined;
```

The format an extension names, or `undefined` for one the server does not know.

The extension is matched case-insensitively, with or without the leading dot, and a
whole file name is read down to the part behind its last dot.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

[`Format`](../interfaces/Format.md) \| `undefined`

---

### getFormatsByMime()

```ts
getFormatsByMime(mime): readonly Format[];
```

The formats served under a MIME type, matched case-insensitively.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `mime`    | `string` |

#### Returns

readonly [`Format`](../interfaces/Format.md)[]

---

### getFormatsByType()

```ts
getFormatsByType(type): readonly Format[];
```

The formats one editor opens, or, for `""`, those a conversion only ever produces.

#### Parameters

| Parameter | Type                                   |
| --------- | -------------------------------------- |
| `type`    | [`FormatType`](../types/FormatType.md) |

#### Returns

readonly [`Format`](../interfaces/Format.md)[]

---

### getMimes()

```ts
getMimes(extension): readonly string[];
```

The MIME types an extension is served under.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

readonly `string`[]

---

### hasFormat()

```ts
hasFormat(extension): boolean;
```

Whether the server knows the extension at all.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isAutoConvertable()

```ts
isAutoConvertable(extension): boolean;
```

Whether the editors convert it on the way in, the way they do the legacy `doc`.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isCommentable()

```ts
isCommentable(extension): boolean;
```

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isConvertibleTo()

```ts
isConvertibleTo(from, to): boolean;
```

Whether the conversion API turns `from` into `to`.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `from`    | `string` |
| `to`      | `string` |

#### Returns

`boolean`

---

### isEditable()

```ts
isEditable(extension): boolean;
```

Whether the editors save it back in its own format, rather than only read it.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isEncryptable()

```ts
isEncryptable(extension): boolean;
```

Whether the editors open it behind a password.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isFillable()

```ts
isFillable(extension): boolean;
```

Whether it is a form the editors fill in rather than edit.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isLossyEditable()

```ts
isLossyEditable(extension): boolean;
```

Whether editing it loses what the format cannot carry, the way `rtf` and `odt` do.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isOpenable()

```ts
isOpenable(extension): boolean;
```

Whether an editor opens the extension at all, in whatever mode.

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isReviewable()

```ts
isReviewable(extension): boolean;
```

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`

---

### isViewable()

```ts
isViewable(extension): boolean;
```

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `extension` | `string` |

#### Returns

`boolean`
