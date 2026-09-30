# @onlyoffice/docs-integration-sdk

TypeScript SDK for integrating ONLYOFFICE Docs editors into your application.

- Build and sign the editor config.
- Receive, verify and answer callbacks.
- Call the conversion API, the command service and the document builder.
- Built on the standard `fetch`: no dependencies for HTTP, works in Node.js 20.19+, Deno, Bun,
  browsers and edge runtimes. ESM and CJS, with type definitions.

> [!NOTE]
> The SDK is at an early stage. The API may change before 1.0.

## Installation

```sh
npm install @onlyoffice/docs-integration-sdk
```

### Subpath imports

The package root exports everything. Each module is also available on its own subpath:

| Subpath                                     | Exports                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@onlyoffice/docs-integration-sdk/callback` | `DocumentServerCallback`, `CallbackError`, the events it reports                             |
| `@onlyoffice/docs-integration-sdk/client`   | `DocumentServerClient`, `DocumentServerRawClient`, `splitFileUrl`, their requests and errors |
| `@onlyoffice/docs-integration-sdk/config`   | `DocumentServerConfig`, `ConfigError`, `buildDocumentKey`, the config types                  |
| `@onlyoffice/docs-integration-sdk/formats`  | `DocumentServerFormats`, `Format`, `FormatType`, `FormatAction`                              |
| `@onlyoffice/docs-integration-sdk/jwt`      | `DocumentServerJwt`, `JwtError`                                                              |

```ts
import { DocumentServerJwt } from "@onlyoffice/docs-integration-sdk/jwt";
```

Modules don't import each other. Where one works with another, it takes any object of the right
shape, so `DocumentServerJwt` and `DocumentServerFormats` can be replaced with your own classes.

A class is the same whichever path you import it from. A `JwtError` thrown by a signer from
`/jwt` passes `instanceof` against the `JwtError` of the root, in ESM and in CJS.

## Quick start

An integration does three things: it opens the editor with a signed config, receives the
callback when the document is saved, and stores the file. The examples below use `Request` and
`Response` handlers, as in Next.js, Hono or Deno. See [Handling callbacks](docs/guides/callback.md)
for Express.

### 1. Set up the SDK

```ts
import {
  buildDocumentKey,
  DocumentServerCallback,
  DocumentServerClient,
  DocumentServerConfig,
  DocumentServerFormats,
  DocumentServerJwt,
  splitFileUrl,
} from "@onlyoffice/docs-integration-sdk";

const publicUrl = "https://docs.example.com";

const client = new DocumentServerClient({ baseUrl: publicUrl });
const jwt = new DocumentServerJwt({ secret: process.env["DOCS_JWT_SECRET"] ?? "" });
const formats = new DocumentServerFormats(await client.getFormats());
```

### 2. Open the editor

Build the config on the server and sign it:

```ts
export async function GET(request: Request): Promise<Response> {
  const user = await session.user(request);
  const file = await storage.find(new URL(request.url).searchParams.get("fileId"));

  const config = new DocumentServerConfig(
    {
      document: {
        key: await buildDocumentKey(file.id, file.version),
        title: file.name,
        url: file.downloadUrl,
        permissions: { edit: true },
      },
      editorConfig: {
        callbackUrl: `https://app.example.com/callback?fileId=${file.id}`,
        user: { id: user.id, name: user.name },
      },
    },
    formats,
  );

  return Response.json(await config.sign(jwt));
}
```

Open it in the page:

```html
<div id="placeholder"></div>
<script src="https://docs.example.com/web-apps/apps/api/documents/api.js"></script>
<script type="module">
  const config = await fetch("/editor-config?fileId=17").then((response) => response.json());

  new DocsAPI.DocEditor("placeholder", config);
</script>
```

### 3. Save the document

The document server posts to `callbackUrl` when the document changes. Download the new version
and store it:

```ts
export async function POST(request: Request): Promise<Response> {
  const fileId = new URL(request.url).searchParams.get("fileId");
  const callback = await DocumentServerCallback.fromRequest(request, { verifier: jwt });

  const reply = await callback.handle({
    save: async ({ url }) => {
      const { path, query } = splitFileUrl(url, publicUrl);
      const download = await client.getFile(path, query);

      await storage.saveNewVersion(fileId, download.body);
    },
  });

  return Response.json(reply);
}
```

`handle()` returns `ok` (`{ error: 0 }`) once your handler has finished, and `fail` (`{ error: 1 }`)
if it threw. See
[Reply to the document server](docs/guides/callback.md#reply-to-the-document-server).

> [!IMPORTANT]
> Before going to production, check the callback's document key against the file, building it
> with `buildDocumentKey()` from the same parts as in step 2. See
> [Check the document key](docs/guides/callback.md#check-the-document-key).

## Guides

| Guide                                                      | Covers                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| [Opening an editor](docs/guides/editor.md)                 | `DocumentServerConfig`, permissions, signing, document keys |
| [Handling callbacks](docs/guides/callback.md)              | `DocumentServerCallback`, events, saving, replying          |
| [JWT](docs/guides/jwt.md)                                  | `DocumentServerJwt`: signing and verifying tokens           |
| [Client options](docs/guides/client.md)                    | options, per-request options, the raw client                |
| [Converting documents](docs/guides/conversion.md)          | `convert()`, `convertFromFile()`                            |
| [Commands](docs/guides/commands.md)                        | `command()`: `info`, `forcesave`, `drop` and the rest       |
| [Document builder](docs/guides/document-builder.md)        | `docbuilder()`, `docbuilderFromFile()`                      |
| [Downloading files](docs/guides/files.md)                  | `getFile()`, `splitFileUrl()`                               |
| [Server configuration and formats](docs/guides/formats.md) | `getConfig()`, `getFormats()`, `DocumentServerFormats`      |
| [Errors](docs/guides/errors.md)                            | the error classes and how to tell them apart                |

The [API reference](docs/api/README.md) lists every export, generated from the source.

## Requirements

- Node.js 20.19 or later, Deno, Bun, a modern browser or an edge runtime.
- ONLYOFFICE Docs. The editor config types follow the Docs version through
  [`@onlyoffice/doceditor-types`](https://www.npmjs.com/package/@onlyoffice/doceditor-types).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE)
