[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / DocumentServerClient

# Class: DocumentServerClient

The document server endpoints, each parsing the answer into the type its endpoint
promises and rejecting when the server reports a failure — in the status, or, the way
the conversion, command and builder services do, in a body it answered `200 OK` with.

## Constructors

### Constructor

```ts
new DocumentServerClient(options): DocumentServerClient;
```

#### Parameters

| Parameter | Type                                                     |
| --------- | -------------------------------------------------------- |
| `options` | [`ClientOptions`](../interfaces/client.ClientOptions.md) |

#### Returns

`DocumentServerClient`

## Properties

| Property               | Modifier   | Type                                                           | Description                                                  |
| ---------------------- | ---------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| <a id="raw"></a> `raw` | `readonly` | [`DocumentServerRawClient`](client.DocumentServerRawClient.md) | The same endpoints, answering with the untouched `Response`. |

## Accessors

### options

#### Get Signature

```ts
get options(): Readonly<Required<ClientOptions>>;
```

The effective settings: validated, with the defaults applied, and frozen.

##### Returns

`Readonly`\<`Required`\<[`ClientOptions`](../interfaces/client.ClientOptions.md)\>\>

## Methods

### command()

```ts
command(
   request,
   token?,
   options?
): Promise<CommandResponse>;
```

Runs a command of the command service against a document the editors have open.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `request`  | [`CommandRequest`](../types/client.CommandRequest.md)      |
| `token?`   | `string`                                                   |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<[`CommandResponse`](../interfaces/client.CommandResponse.md)\>

#### Throws

[CommandError](client.CommandError.md) when the service answers with an `error` code other
than `4`, which reports that nothing had changed rather than a failure.

---

### convert()

```ts
convert(
   request,
   token?,
   options?
): Promise<ConvertResponse>;
```

Converts the document the server downloads from `url`.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `request`  | [`ConvertRequest`](../interfaces/client.ConvertRequest.md) |
| `token?`   | `string`                                                   |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<[`ConvertResponse`](../interfaces/client.ConvertResponse.md)\>

#### Throws

[ConversionError](client.ConversionError.md) when the service answers with an `error` code.

---

### docbuilder()

```ts
docbuilder(
   request,
   token?,
   options?
): Promise<BuilderResponse>;
```

Runs the builder script the server downloads from `url`.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `request`  | [`BuilderRequest`](../types/client.BuilderRequest.md)      |
| `token?`   | `string`                                                   |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<[`BuilderResponse`](../interfaces/client.BuilderResponse.md)\>

#### Throws

[BuilderError](client.BuilderError.md) when the service answers with an `error` code.

---

### getConfig()

```ts
getConfig(options?): Promise<ConfigResponse>;
```

How the document server describes itself: the header it expects a token in, the paths
of its endpoints, the largest file it accepts and the languages of its editor.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<[`ConfigResponse`](../interfaces/client.ConfigResponse.md)\>

---

### getFile()

```ts
getFile(
   path,
   query?,
   options?
): Promise<Response>;
```

The file itself, unread, so a large one can be streamed.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `path`     | `string`                                                   |
| `query?`   | `Readonly`\<`Record`\<`string`, `string`\>\>               |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<`Response`\>

---

### getFormats()

```ts
getFormats(options?): Promise<FormatsResponse>;
```

Every file format the document server knows, and what it may be converted to.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<[`FormatsResponse`](../types/client.FormatsResponse.md)\>

---

### healthcheck()

```ts
healthcheck(options?): Promise<boolean>;
```

Whether the document server is up. A failing status is an answer, not a rejection.

#### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/client.RequestOptions.md) |

#### Returns

`Promise`\<`boolean`\>
