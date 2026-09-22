[@onlyoffice/docs-integration-sdk](../README.md) / DocumentServerRawClient

# Class: DocumentServerRawClient

The same endpoints as [DocumentServerClient](DocumentServerClient.md), each answering with the untouched
`Response` and none of them throwing on what the document server says.

## Constructors

### Constructor

```ts
new DocumentServerRawClient(options): DocumentServerRawClient;
```

#### Parameters

| Parameter | Type                                              |
| --------- | ------------------------------------------------- |
| `options` | [`ClientOptions`](../interfaces/ClientOptions.md) |

#### Returns

`DocumentServerRawClient`

## Properties

| Property                       | Modifier   | Type                                                                          | Description                                                               |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="options"></a> `options` | `readonly` | `Readonly`\<`Required`\<[`ClientOptions`](../interfaces/ClientOptions.md)\>\> | The effective settings: validated, with the defaults applied, and frozen. |

## Methods

### command()

```ts
command(
   request,
   token?,
   options?
): Promise<Response>;
```

Posts to `/command`.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `request`  | [`CommandRequest`](../types/CommandRequest.md)      |
| `token?`   | `string`                                            |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### convert()

```ts
convert(
   request,
   token?,
   options?
): Promise<Response>;
```

Posts to `/converter`.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `request`  | [`ConvertRequest`](../interfaces/ConvertRequest.md) |
| `token?`   | `string`                                            |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### docbuilder()

```ts
docbuilder(
   request,
   token?,
   options?
): Promise<Response>;
```

Posts to `/docbuilder`.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `request`  | [`BuilderRequest`](../types/BuilderRequest.md)      |
| `token?`   | `string`                                            |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### getConfig()

```ts
getConfig(options?): Promise<Response>;
```

Gets `/meta/config`, where the document server describes itself.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### getFile()

```ts
getFile(
   path,
   query?,
   options?
): Promise<Response>;
```

Gets a file the document server keeps, by path and query rather than by URL.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `path`     | `string`                                            |
| `query?`   | `Readonly`\<`Record`\<`string`, `string`\>\>        |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### getFormats()

```ts
getFormats(options?): Promise<Response>;
```

Gets `/meta/formats`, the file formats the document server knows.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### healthcheck()

```ts
healthcheck(options?): Promise<Response>;
```

Gets `/healthcheck`.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>
