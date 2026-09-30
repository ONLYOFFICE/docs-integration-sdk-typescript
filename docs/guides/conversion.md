# Converting documents

`convert()` calls `/converter`, the [conversion API][conversion-api]. The document server
downloads the source file from `url` and converts it.

- [Convert a file by URL](#convert-a-file-by-url)
- [Asynchronous conversion](#asynchronous-conversion)
- [Signing](#signing)
- [Cluster routing](#cluster-routing)
- [Upload the file in the request](#upload-the-file-in-the-request)

## Convert a file by URL

```ts
const result = await client.convert({
  filetype: "docx",
  key: "Khirz6zTPdfd7",
  outputtype: "pdf",
  title: "Contract.docx",
  url: "https://example.com/contract.docx",
});

result.fileUrl; // https://docs.example.com/cache/files/…/output.pdf
```

To download the result, see [Downloading files](files.md).

`ConvertRequest` types every parameter of the [request][conversion-request]: thumbnails,
spreadsheet layout, PDF and form output, watermarks, passwords, CSV options and the rest:

```ts
await client.convert({
  filetype: "xlsx",
  key: "Khirz6zTPdfd7",
  outputtype: "pdf",
  url: "https://example.com/report.xlsx",
  region: "de-DE",
  spreadsheetLayout: {
    orientation: "landscape",
    fitToWidth: 1,
    gridLines: true,
    margins: { left: "10mm", right: "10mm", top: "10mm", bottom: "10mm" },
  },
});
```

**Errors.** The service answers `200 OK` whether the conversion succeeded or failed. On failure
the body has an `error` code from `-1` to `-10`, described in the
[documentation][conversion-errors]. The SDK rejects with a `ConversionError` that holds it as
`code`, typed as `ConversionErrorCode`. See [Errors](errors.md).

**Headers.** `Accept: application/json` is sent for you; without it the service answers in XML.
A `content-type` in the configured `headers` is replaced, not merged.

**The key** identifies the source document. The same key returns the cached result, so a new
version of a file needs a new key.

## Asynchronous conversion

By default the document server keeps the connection open until the file is ready. A large file
can take longer than `timeoutMs`, or than the timeout of the reverse proxy in front of the
server.

With `async: true` the call returns at once with `endConvert: false` and a `percent`. Repeat the
same request, unchanged, until `endConvert` is `true`:

```ts
const request: ConvertRequest = { async: true, filetype: "docx", key, outputtype: "pdf", url };

for (;;) {
  const result = await client.convert(request);

  if (result.endConvert) break;

  await new Promise((resolve) => setTimeout(resolve, 1000));
}
```

## Signing

When the document server has a JWT secret, send a token in the body or in a header. See
[Body token and header token](jwt.md#body-token-and-header-token).

```ts
const jwt = new DocumentServerJwt({ secret });

await client.convert({ ...request, token: await jwt.sign(request) });
await client.convert(request, await jwt.signHeader(request));
```

## Cluster routing

In a document server cluster, the SDK adds a `shardkey` query parameter with the document key.
It keeps all calls about one document on the same node. It is a query parameter, so it isn't
part of either signed payload. It is always sent; versions before Docs 8.1 ignore it.

## Upload the file in the request

`convertFromFile()` calls `/converter/from-file`. It sends the document itself in a
`multipart/form-data` request instead of a `url`. Use it for a file the document server can't
reach, or one that isn't stored anywhere yet. It answers with the converted file:

```ts
import { createWriteStream, openAsBlob } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const result = await client.convertFromFile(
  { filetype: "docx", key, outputtype: "pdf", title: "Contract.docx" },
  await openAsBlob("contract.docx"),
);

if (result.endConvert && result.file.body !== null) {
  await pipeline(Readable.fromWeb(result.file.body), createWriteStream("Contract.pdf"));
}
```

**The request** takes the same parameters as `convert()`, except `url`:

- The parameters are sent as JSON in a `params` part. The document follows as `file`, with the
  name of the `File`, or `document.<filetype>` for a `Blob` without a name.
- `title` names the converted file, which the answer carries in `Content-Disposition`.
- `key` is optional; without it the service makes one up. The `shardkey` query parameter
  carries it when there is one.

**The answer** is streamed, like [`getFile()`](files.md). The timeout covers the conversion and
stops once the answer arrives.

**Asynchronous mode.** With `async: true` the call returns `{ endConvert: false, percent }`.
Repeat the same request until `endConvert` is `true`; `file` is then set. Each repeat uploads the
document again.

**Errors.** A failed conversion answers `200 OK` with an `error` code, like `/converter`, and
rejects with a `ConversionError`.

**Signing.** Send the token as for `convert()`: in the params as `token`, or in a header as the
third argument. The token must have `operation: "converter"`, otherwise it is refused as invalid
(`-8`). See [The operation claim](jwt.md#the-operation-claim).

```ts
const signOptions = { operation: "converter" } as const;

await client.convertFromFile({ ...request, token: await jwt.sign(request, signOptions) }, file);
await client.convertFromFile(request, file, await jwt.signHeader(request, signOptions));
```

> [!NOTE]
> This endpoint is newer than the rest. A document server that has it lists it in
> `urls.converterFromFile` of [`getConfig()`](formats.md#server-configuration). One that doesn't
> answers `404`, which rejects with a `DocumentServerHttpError`.

[conversion-api]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/
[conversion-request]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/request/
[conversion-errors]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/error-codes/
