# Document builder

`docbuilder()` calls `/docbuilder`, the [document builder API][builder-api]. The document server
downloads a `.js` script from `url` and runs it against the Office JavaScript API to generate
files.

- [Run a script by URL](#run-a-script-by-url)
- [Pass arguments](#pass-arguments)
- [Asynchronous builds](#asynchronous-builds)
- [Signing](#signing)
- [Upload the script in the request](#upload-the-script-in-the-request)

## Run a script by URL

```ts
const result = await client.docbuilder({ url: "https://example.com/contract.js" });

result.urls; // { "output.docx": "https://docs.example.com/…/output.docx" }
```

The script decides what is produced. Each `builder.SaveFile()` in it adds an entry to `urls`,
keyed by the file name. One build can return a document and a spreadsheet at once.

To download the results, see [Downloading files](files.md).

**Errors.** Like a conversion, the service answers `200 OK` either way. On failure the body has
an `error` code (`-1`, `-2`, `-3`, `-4`, `-6` or `-8`, listed on `BuilderErrorCode`), and the SDK
rejects with a `BuilderError`. See [Errors](errors.md).

## Pass arguments

Put values for the script in `argument`. The script reads them from its `Argument` global:

```ts
await client.docbuilder({
  url: "https://example.com/contract.js",
  argument: { customer: "Acme", total: 1499, items: ["License", "Support"] },
});
```

## Asynchronous builds

By default the document server keeps the connection open until the files are ready. A
long-running script can take longer than `timeoutMs`.

With `async: true` the call returns at once with `end: false` and the `key` of the build. Repeat
the request with that key, and nothing else, until `end` is `true`:

```ts
const started = await client.docbuilder({ async: true, url });

if (started.key === undefined) throw new Error("the builder service minted no key");

let result = started;

while (!result.end) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  result = await client.docbuilder({ async: true, key: started.key });
}

result.urls; // { "output.docx": "…" }
```

`BuilderRequest` is a union of the two requests: starting a build needs `url`, collecting the
result needs `key`. Neither can be sent empty.

The `shardkey` query parameter carries the build key, so every poll reaches the node running the
build. The first request has no key yet and is sent without it.

## Signing

Send the token in the body as `token`, or in a header as the second argument. See
[Body token and header token](jwt.md#body-token-and-header-token).

```ts
await client.docbuilder({ ...request, token: await jwt.sign(request) });
await client.docbuilder(request, await jwt.signHeader(request));
```

## Upload the script in the request

`docbuilderFromFile()` calls `/docbuilder/from-file`. It sends the script itself in a
`multipart/form-data` request instead of a `url`. Use it for a script the document server can't
reach, or one generated on the fly. It answers like `docbuilder()`, with the `key`, `end` and
`urls` of the build:

```ts
const result = await client.docbuilderFromFile(
  { argument: { customer: "Acme" } },
  new Blob([script], { type: "text/javascript" }),
);

result.urls; // { "output.docx": "https://docs.example.com/…/output.docx" }
```

**The request** takes `argument`, `async` and `token`:

- The parameters are sent as JSON in a `params` part. The script follows as `file`, with the name
  of the `File`, or `script.docbuilder` for a `Blob` without a name.
- There is no `key`. The service creates one for every build and answers `-3` to a request that
  sets its own.

**Asynchronous mode.** With `async: true` the call returns `end: false` and the key. Collect the
result with `docbuilder({ async: true, key })`, as for any build. The script is not uploaded
again.

**Signing.** Send the token in the params as `token`, or in a header as the third argument. The
token must have `operation: "docbuilder"`, otherwise it is refused as invalid (`-8`). The polls
through `docbuilder()` don't need it. See [The operation claim](jwt.md#the-operation-claim).

```ts
const signOptions = { operation: "docbuilder" } as const;

await client.docbuilderFromFile({ ...request, token: await jwt.sign(request, signOptions) }, file);
await client.docbuilderFromFile(request, file, await jwt.signHeader(request, signOptions));
```

> [!NOTE]
> A document server that has this endpoint lists it in `urls.docbuilderFromFile` of
> [`getConfig()`](formats.md#server-configuration). One that doesn't answers `404`, which rejects
> with a `DocumentServerHttpError`.

[builder-api]: https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/
