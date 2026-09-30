[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerRawClient

# Class: DocumentServerRawClient

The same endpoints as [DocumentServerClient](DocumentServerClient.md), returning the untouched `Response`. It
never rejects on what the document server answers, only when no answer comes: with
[DocumentServerNetworkError](DocumentServerNetworkError.md), with [DocumentServerTimeoutError](DocumentServerTimeoutError.md), or with the
reason of your `signal` when you cancel the call. A `timeoutMs` in the call options that is
not a whole number from 1 to 2147483647 rejects with a `TypeError`.

Every request gets, in this order, each over the one before:

1. the configured `headers`;
2. the headers the endpoint needs: `content-type` and `accept` set to `application/json`
   for a JSON body, no `content-type` for a form, whose boundary `fetch` writes, and the
   authorization header when a token is given;
3. the `headers` of the call. Names are matched in any case.

The deadline is `timeoutMs`, of the call or of the client. It covers the whole exchange,
except for [DocumentServerRawClient.getFile](#getfile) and
[DocumentServerRawClient.convertFromFile](#convertfromfile), where it stops once the response arrives.

## See

[The raw client](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/client.md#the-raw-client)

## Constructors

### Constructor

```ts
new DocumentServerRawClient(options): DocumentServerRawClient;
```

#### Parameters

| Parameter | Type                                              | Description                                                            |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `options` | [`ClientOptions`](../interfaces/ClientOptions.md) | The address of the document server, and the defaults of every request. |

#### Returns

`DocumentServerRawClient`

#### Throws

when `baseUrl` is not an absolute `http` or `https` URL, or
`timeoutMs` is not a whole number from `1` to `2147483647`.

## Properties

| Property                                | Modifier   | Type                                                                          | Description                                                   |
| --------------------------------------- | ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| <a id="property-options"></a> `options` | `readonly` | `Readonly`\<`Required`\<[`ClientOptions`](../interfaces/ClientOptions.md)\>\> | The settings in effect: validated, with defaults, and frozen. |

## Methods

### command()

```ts
command(
   request,
   token?,
   options?
): Promise<Response>;
```

Posts `request` as JSON to `/command`, with its `key` as the `shardkey` query parameter.
`getForgottenList`, `license` and `version` have no key and are sent without it.

#### Parameters

| Parameter  | Type                                                  |
| ---------- | ----------------------------------------------------- |
| `request`  | [`CommandRequest`](../type-aliases/CommandRequest.md) |
| `token?`   | `string`                                              |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)   |

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

Posts `request` as JSON to `/converter`, with its `key` as the `shardkey` query parameter.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `request`  | [`ConvertRequest`](../interfaces/ConvertRequest.md) |
| `token?`   | `string`                                            |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### convertFromFile()

```ts
convertFromFile(
   request,
   file,
   token?,
   options?
): Promise<Response>;
```

Posts `request` and the document as `multipart/form-data` to `/converter/from-file`, with
its `key`, when given, as the `shardkey` query parameter. On a 2xx the body is the
converted file, or JSON while an `async` conversion runs.

#### Parameters

| Parameter  | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| `request`  | [`ConvertFileRequest`](../type-aliases/ConvertFileRequest.md) |
| `file`     | `Blob`                                                        |
| `token?`   | `string`                                                      |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)           |

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

Posts `request` as JSON to `/docbuilder`, with its `key`, when given, as the `shardkey`
query parameter.

#### Parameters

| Parameter  | Type                                                  |
| ---------- | ----------------------------------------------------- |
| `request`  | [`BuilderRequest`](../type-aliases/BuilderRequest.md) |
| `token?`   | `string`                                              |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)   |

#### Returns

`Promise`\<`Response`\>

---

### docbuilderFromFile()

```ts
docbuilderFromFile(
   request,
   file,
   token?,
   options?
): Promise<Response>;
```

Posts `request` and the script as `multipart/form-data` to `/docbuilder/from-file`,
without a `shardkey`: the service creates the key.

#### Parameters

| Parameter  | Type                                                      |
| ---------- | --------------------------------------------------------- |
| `request`  | [`BuildFileRequest`](../type-aliases/BuildFileRequest.md) |
| `file`     | `Blob`                                                    |
| `token?`   | `string`                                                  |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)       |

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

Gets a file the document server keeps, by the path and the query
[splitFileUrl](../functions/splitFileUrl.md) returns. Sends no token. On a 2xx the body is the file, unread.

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

Gets `/healthcheck`, whose body is `true` when the server is up.

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>
