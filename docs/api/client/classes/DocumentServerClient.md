[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / DocumentServerClient

# Class: DocumentServerClient

The client of the document server. Each method calls one endpoint, parses the answer into
the type the endpoint promises, and rejects when the document server reports a failure: in
the status, or in a `200 OK` body, as the conversion, command and builder services do.

Besides the errors each method lists, every method rejects with:

- [DocumentServerNetworkError](DocumentServerNetworkError.md) when the server can't be reached or the connection
  breaks;
- [DocumentServerTimeoutError](DocumentServerTimeoutError.md) when `timeoutMs` passes first;
- the reason of your `signal`, unchanged, when you cancel the call;
- a `TypeError` when `timeoutMs` in the call options is not a whole number from 1 to 2147483647.

For the untouched `Response`, use [DocumentServerClient.raw](#property-raw).

## Example

```ts
const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });

const result = await client.convert(request, await jwt.signHeader(request));
```

## See

- [Client options](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/client.md)
- [Errors](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/errors.md)

## Constructors

### Constructor

```ts
new DocumentServerClient(options): DocumentServerClient;
```

#### Parameters

| Parameter | Type                                              | Description                                                            |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `options` | [`ClientOptions`](../interfaces/ClientOptions.md) | The address of the document server, and the defaults of every request. |

#### Returns

`DocumentServerClient`

#### Throws

when `baseUrl` is not an absolute `http` or `https` URL, or
`timeoutMs` is not a whole number from `1` to `2147483647`.

## Properties

| Property                        | Modifier   | Type                                                    | Description                                                                                                                                                     |
| ------------------------------- | ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-raw"></a> `raw` | `readonly` | [`DocumentServerRawClient`](DocumentServerRawClient.md) | The same endpoints, returning the untouched `Response`. The typed methods send their requests through it, with the same options, headers, deadline and `fetch`. |

## Accessors

### options

#### Get Signature

```ts
get options(): Readonly<Required<ClientOptions>>;
```

The settings in effect: validated, with defaults, and frozen. The same object as `raw.options`.

##### Returns

`Readonly`\<`Required`\<[`ClientOptions`](../interfaces/ClientOptions.md)\>\>

## Methods

### command()

```ts
command(
   request,
   token?,
   options?
): Promise<CommandResponse>;
```

Runs a command of `/command`, the command service, picked by `request.c`.

#### Parameters

| Parameter  | Type                                                  | Description                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request`  | [`CommandRequest`](../type-aliases/CommandRequest.md) | The command and its parameters.                                                                                                                                                                                                                       |
| `token?`   | `string`                                              | A token for the authorization header, from [DocumentServerJwt.signHeader()](../../jwt/classes/DocumentServerJwt.md#signheader). Without it, no authorization header is sent: for a server without a JWT secret, or with the token in `request.token`. |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)   | Overrides for this call: a `signal`, a `timeoutMs` and `headers`.                                                                                                                                                                                     |

#### Returns

`Promise`\<[`CommandResponse`](../interfaces/CommandResponse.md)\>

The response. `error` is `0`, or `4` when there was nothing to save since the
last save: an outcome of `forcesave`, not a failure.

#### Example

```ts
const { users } = await client.command({ c: "info", key: "Khirz6zTPdfd7" });
```

#### Throws

[CommandError](CommandError.md) when `error` is neither `0` nor `4`.

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON object.

#### See

[Commands](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/commands.md)

---

### convert()

```ts
convert(
   request,
   token?,
   options?
): Promise<ConvertResponse>;
```

Converts a document with `/converter`. The document server downloads it from
`request.url`.

#### Parameters

| Parameter  | Type                                                | Description                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request`  | [`ConvertRequest`](../interfaces/ConvertRequest.md) | The conversion parameters.                                                                                                                                                                                                                            |
| `token?`   | `string`                                            | A token for the authorization header, from [DocumentServerJwt.signHeader()](../../jwt/classes/DocumentServerJwt.md#signheader). Without it, no authorization header is sent: for a server without a JWT secret, or with the token in `request.token`. |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) | Overrides for this call: a `signal`, a `timeoutMs` and `headers`.                                                                                                                                                                                     |

#### Returns

`Promise`\<[`ConvertResponse`](../interfaces/ConvertResponse.md)\>

`fileUrl` once `endConvert` is `true`, or `percent` while an `async` conversion
runs. Repeat the same request until `endConvert` is `true`.

#### Example

```ts
const result = await client.convert({
  filetype: "docx",
  key: "Khirz6zTPdfd7",
  outputtype: "pdf",
  url: "https://example.com/contract.docx",
});

result.fileUrl; // https://docs.example.com/cache/files/…/output.pdf
```

#### Throws

[ConversionError](ConversionError.md) when the body has an `error` code other than `0`.

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON object.

#### See

[Converting documents](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/conversion.md)

---

### convertFromFile()

```ts
convertFromFile(
   request,
   file,
   token?,
   options?
): Promise<ConvertFileResult>;
```

Converts a document sent in the request, with `/converter/from-file`, for a file the
document server can't download.

The request is `multipart/form-data`: `request` as JSON in a `params` part, then the
document as `file`, named after the `File`, or `document.<filetype>` for a `Blob` without
a name. `timeoutMs` covers the wait for the answer and stops once it arrives, so the
converted file can be read for as long as it takes.

A token, in the header or in `request.token`, must carry `operation: "converter"`.

#### Parameters

| Parameter  | Type                                                          | Description                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request`  | [`ConvertFileRequest`](../type-aliases/ConvertFileRequest.md) | The conversion parameters, without `url`.                                                                                                                                                                                                             |
| `file`     | `Blob`                                                        | The document.                                                                                                                                                                                                                                         |
| `token?`   | `string`                                                      | A token for the authorization header, from [DocumentServerJwt.signHeader()](../../jwt/classes/DocumentServerJwt.md#signheader). Without it, no authorization header is sent: for a server without a JWT secret, or with the token in `request.token`. |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)           | Overrides for this call: a `signal`, a `timeoutMs` and `headers`.                                                                                                                                                                                     |

#### Returns

`Promise`\<[`ConvertFileResult`](../type-aliases/ConvertFileResult.md)\>

`{ endConvert: true, file }`, with the converted file as an unread `Response`, or
`{ endConvert: false, percent }` while an `async` conversion runs. Repeat the same request,
which uploads the document again, until `endConvert` is `true`. A 2xx that is not
`application/json` is taken as the converted file.

#### Throws

[ConversionError](ConversionError.md) when the body has an `error` code other than `0`.

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range, `404`
included for a document server without this endpoint.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when a JSON body is not a JSON object, or is
neither an error nor `endConvert: false`.

#### See

[Upload the file in the request](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/conversion.md#upload-the-file-in-the-request)

---

### docbuilder()

```ts
docbuilder(
   request,
   token?,
   options?
): Promise<BuilderResponse>;
```

Runs a document builder script with `/docbuilder`. The document server downloads it from
`request.url`. To collect an `async` build, send `{ async: true, key }` instead.

#### Parameters

| Parameter  | Type                                                  | Description                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request`  | [`BuilderRequest`](../type-aliases/BuilderRequest.md) | The script URL and its `argument`, or the key of a build to collect.                                                                                                                                                                                  |
| `token?`   | `string`                                              | A token for the authorization header, from [DocumentServerJwt.signHeader()](../../jwt/classes/DocumentServerJwt.md#signheader). Without it, no authorization header is sent: for a server without a JWT secret, or with the token in `request.token`. |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)   | Overrides for this call: a `signal`, a `timeoutMs` and `headers`.                                                                                                                                                                                     |

#### Returns

`Promise`\<[`BuilderResponse`](../interfaces/BuilderResponse.md)\>

`urls`, the files the script saved, once `end` is `true`, or the `key` of the
build and `end: false` while an `async` build runs.

#### Example

```ts
const { urls } = await client.docbuilder({ url: "https://example.com/contract.js" });
```

#### Throws

[BuilderError](BuilderError.md) when the body has an `error` code other than `0`.

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON object.

#### See

[Document builder](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/document-builder.md)

---

### docbuilderFromFile()

```ts
docbuilderFromFile(
   request,
   file,
   token?,
   options?
): Promise<BuilderResponse>;
```

Runs a document builder script sent in the request, with `/docbuilder/from-file`.

The request is `multipart/form-data`: `request` as JSON in a `params` part, then the
script as `file`, named after the `File`, or `script.docbuilder` for a `Blob` without a
name. Collect an `async` build with `docbuilder({ async: true, key })`, which doesn't
upload the script again.

A token, in the header or in `request.token`, must carry `operation: "docbuilder"`.

#### Parameters

| Parameter  | Type                                                      | Description                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request`  | [`BuildFileRequest`](../type-aliases/BuildFileRequest.md) | The `argument` of the script, `async` and `token`. No `key`: the service creates one.                                                                                                                                                                 |
| `file`     | `Blob`                                                    | The script.                                                                                                                                                                                                                                           |
| `token?`   | `string`                                                  | A token for the authorization header, from [DocumentServerJwt.signHeader()](../../jwt/classes/DocumentServerJwt.md#signheader). Without it, no authorization header is sent: for a server without a JWT secret, or with the token in `request.token`. |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md)       | Overrides for this call: a `signal`, a `timeoutMs` and `headers`.                                                                                                                                                                                     |

#### Returns

`Promise`\<[`BuilderResponse`](../interfaces/BuilderResponse.md)\>

What [DocumentServerClient.docbuilder](#docbuilder) returns.

#### Throws

[BuilderError](BuilderError.md) when the body has an `error` code other than `0`.

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range, `404`
included for a document server without this endpoint.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON object.

#### See

[Upload the script in the request](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/document-builder.md#upload-the-script-in-the-request)

---

### getConfig()

```ts
getConfig(options?): Promise<ConfigResponse>;
```

Gets `/meta/config`, where the document server describes itself: the header it expects a
token in, the paths of its endpoints, the largest file it accepts and the languages of the
editor. Takes no token.

#### Parameters

| Parameter  | Type                                                | Description                                                       |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) | Overrides for this call: a `signal`, a `timeoutMs` and `headers`. |

#### Returns

`Promise`\<[`ConfigResponse`](../interfaces/ConfigResponse.md)\>

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON object.

---

### getFile()

```ts
getFile(
   path,
   query?,
   options?
): Promise<Response>;
```

Downloads a file the document server keeps: a conversion result, a forgotten document, a
saved document. Split the URL the server handed out with [splitFileUrl](../functions/splitFileUrl.md) first.

Sends no token: the URL is signed by the document server itself. `timeoutMs` covers the
wait for the response and stops once it arrives, so the body can be read for as long as
it takes. To cancel a download in progress, pass a `signal`.

#### Parameters

| Parameter  | Type                                                | Description                                                       |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `path`     | `string`                                            | The path of the file, relative to `baseUrl`.                      |
| `query?`   | `Readonly`\<`Record`\<`string`, `string`\>\>        | The query the document server signed the URL with.                |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) | Overrides for this call: a `signal`, a `timeoutMs` and `headers`. |

#### Returns

`Promise`\<`Response`\>

The response, with the body unread, so a large file can be streamed.

#### Example

```ts
const { path, query } = splitFileUrl(result.fileUrl, "https://docs.example.com");
const file = await client.getFile(path, query);

await pipeline(Readable.fromWeb(file.body), createWriteStream("output.pdf"));
```

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range, before
the body is handed over.

#### See

[Downloading files](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/files.md)

---

### getFormats()

```ts
getFormats(options?): Promise<FormatsResponse>;
```

Gets `/meta/formats`: every format the document server knows, what the editors can do
with it and what it converts to. Takes no token. Pass the result to
[DocumentServerFormats](../../formats/classes/DocumentServerFormats.md) to look formats up.

#### Parameters

| Parameter  | Type                                                | Description                                                       |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) | Overrides for this call: a `signal`, a `timeoutMs` and `headers`. |

#### Returns

`Promise`\<[`FormatsResponse`](../type-aliases/FormatsResponse.md)\>

#### Throws

[DocumentServerHttpError](DocumentServerHttpError.md) when the status is outside the 2xx range.

#### Throws

[DocumentServerParseError](DocumentServerParseError.md) when the body is not a JSON array.

---

### healthcheck()

```ts
healthcheck(options?): Promise<boolean>;
```

Calls `/healthcheck`.

#### Parameters

| Parameter  | Type                                                | Description                                                       |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `options?` | [`RequestOptions`](../interfaces/RequestOptions.md) | Overrides for this call: a `signal`, a `timeoutMs` and `headers`. |

#### Returns

`Promise`\<`boolean`\>

`true` when the server answers `true`. `false` for any other body, and for a
status outside the 2xx range: a server that reports itself unhealthy is an answer, not a
failure. A server that can't be reached still rejects.
