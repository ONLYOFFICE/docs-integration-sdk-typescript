# @onlyoffice/docs-integration-sdk

TypeScript SDK for integrating ONLYOFFICE Docs editors.

Built on the standard `fetch` — no HTTP dependencies, works in Node.js 20+, Deno, Bun,
browsers and edge runtimes. Ships both ESM and CJS builds with bundled type definitions.

Early stage: the client currently covers the health check, the server configuration and
formats, the conversion API, the command service, the document builder and downloading
the files the server hands back, `DocumentServerConfig` builds the config an editor is
opened with, and `DocumentServerJwt` signs the tokens they are sent with and checks the
ones that come back.

## Installation

```sh
npm install @onlyoffice/docs-integration-sdk
```

## Usage

```ts
import { DocumentServerClient } from "@onlyoffice/docs-integration-sdk";

const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  timeoutMs: 5_000,
  headers: { "x-request-source": "my-app" },
});

const healthy = await client.healthcheck();
```

Every method parses the answer into the type its endpoint promises, and rejects when the
document server reports a failure — in the status, or, the way the conversion, command and
builder services do, in a body it answered `200 OK` with. See [Errors](#errors).

The untouched `Response` is one property away, on [`client.raw`](#the-raw-client), for a
caller who would rather decide what a failure means.

## API reference

Every export — the two clients, the signer, the errors, and each request and response
type — is listed in [docs/](docs/README.md), generated from the source with
[TypeDoc](https://typedoc.org). This README is the guide; the reference is where a single
field is looked up.

```sh
npm run docs
```

The output is committed, so a change to the public API is reviewed along with the code
that made it. Rerun the command after touching an exported type or a doc comment.

## Server configuration

`getConfig()` gets `/meta/config`, where the document server describes itself: the header
it expects a JWT in, the paths of its endpoints, the largest file it accepts and the
languages its editor is translated into.

```ts
const config = await client.getConfig();

config.authorization; // { header: "Authorization", prefix: "Bearer " }
config.urls.api; // /web-apps/apps/api/documents/api.js
config.limits.maxFileSize; // 104857600
config.langs; // ["ar", "az", …, "zh-TW"]
```

`authorization` is what `authorizationHeader` and `authorizationPrefix` have to be set to:
a server configured with a header name of its own rejects a token sent under the default
one. This endpoint describes the server rather than a document, so it takes no token, and it
carries no error code of its own: only a status outside the 2xx range makes it fail, and
that rejects with a `DocumentServerHttpError`.

## Formats

`getFormats()` gets `/meta/formats`, the list of file formats the server knows — what each
one may be opened for, and what it converts to:

```ts
const formats = await client.getFormats();
const docx = formats.find((format) => format.name === "docx");

docx?.type; // word
docx?.actions; // ["view", "edit", "review", "comment", "encrypt"]
docx?.convert; // ["bmp", "docm", …, "txt"]
docx?.mime; // ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
```

`type` names the editor a format opens in, which is the `documentType` the editor config
needs; `actions` says what that editor may do with it — `edit`, `fill`, `comment`,
`review`, `auto-convert` for a legacy format converted on the way in, and so on. Formats
that a conversion only ever produces, images and `pdfa` and `zip` among them, carry an
empty `type` and no actions at all, so a lookup has to pass over them rather than take the
first entry that matches an extension.

`convert` is the other half of the conversion API: it holds the extensions that may be
named as an `outputtype` for that source format.

### Looking a format up

Walking the list for every question gets old quickly, so `DocumentServerFormats` takes that
answer once and indexes it by extension:

```ts
import { DocumentServerFormats } from "@onlyoffice/docs-integration-sdk";

const formats = new DocumentServerFormats(await client.getFormats());

formats.getDocumentType("report.docx"); // word
formats.isEditable("docx"); // true
formats.isFillable("pdf"); // true
formats.isConvertibleTo("docx", "pdf"); // true
formats.getConversions("xlsx"); // ["csv", "ods", "pdf", …]
formats.getFormatsByMime("application/pdf"); // [{ name: "pdf", … }]
```

An extension is matched case-insensitively, with or without its dot, and a whole file name
is read down to the part behind its last dot — so `"docx"`, `".DOCX"` and
`"/files/Q3 Report.docx"` are one and the same lookup.

| Method                               | Answers                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `getFormat(ext)`                     | The `Format`, or `undefined` for an extension the server does not know.      |
| `hasFormat(ext)`                     | Whether the extension is known at all.                                       |
| `getDocumentType(ext)`               | The editor it opens in, which is the `documentType` the editor config takes. |
| `getActions(ext)`                    | What the editors may do with it.                                             |
| `can(ext, action)`                   | Whether they may do that one.                                                |
| `isOpenable(ext)`                    | Whether an editor opens it at all, in whatever mode.                         |
| `isViewable(ext)`                    | `view`.                                                                      |
| `isEditable(ext)`                    | `edit`.                                                                      |
| `isLossyEditable(ext)`               | `lossy-edit`, editing that loses what the format cannot carry.               |
| `isFillable(ext)`                    | `fill`, a form filled in rather than edited.                                 |
| `isCommentable(ext)`                 | `comment`.                                                                   |
| `isReviewable(ext)`                  | `review`.                                                                    |
| `isAutoConvertable(ext)`             | `auto-convert`, converted on the way in the way the legacy `doc` is.         |
| `isEncryptable(ext)`                 | `encrypt`.                                                                   |
| `getConversions(ext)`                | The extensions it converts to, as `outputtype` takes them.                   |
| `isConvertibleTo(from, to)`          | Whether the conversion API turns one into the other.                         |
| `getMimes(ext)`                      | The MIME types it is served under.                                           |
| `getFormatsByMime(mime)`             | The formats served under a MIME type.                                        |
| `getFormatsByType(type)`             | The formats one editor opens, or, for `""`, the output-only ones.            |
| `getExtensions()`                    | Every extension the list covers, without the dots.                           |
| `all`, `size`, `[Symbol.iterator]()` | The list itself, frozen, in the order the server gave it.                    |

`getDocumentType()` answers `undefined` both for an extension the server does not know and
for one no editor opens, so it is exactly the question the editor config asks. Where two
entries carry the same extension, `getFormat()` keeps the one an editor opens rather than
the first that matched.

The list changes with the version of the document server and with its licence, so an
instance stands for one answer of `/meta/formats` rather than for the server: get a fresh
list to see a format the server has since learned. Nothing in the class sends a request,
which makes it as good a fit for a list cached beside the application as for one just
fetched.

## Editor config

`DocumentServerConfig` builds the [config][config-api] an editor is opened with — the
object `DocsAPI.DocEditor` is constructed with in the browser — and validates and signs it
here, where the secret is.

Its fields are the ones the editor API documents, typed by
[`@onlyoffice/doceditor-types`][doceditor-types], the definitions ONLYOFFICE publishes,
which this package depends on. Their version tracks the version of the document server —
`9.4.2` is Docs `9.4.0` — so the config follows the server your editors run rather than
the release schedule of this SDK.

```ts
import {
  buildDocumentKey,
  DocumentServerConfig,
  DocumentServerFormats,
} from "@onlyoffice/docs-integration-sdk";

const formats = new DocumentServerFormats(await client.getFormats());

const config = DocumentServerConfig.forFile(
  {
    key: buildDocumentKey(file.id, file.modifiedAt),
    title: "Report.docx",
    url: "https://storage.example.com/report.docx",
  },
  formats,
  {
    editorConfig: {
      callbackUrl: "https://app.example.com/callback",
      lang: "de",
      user: { id: "u-17", name: "Anna Schmidt" },
    },
  },
);

config.config.documentType; // word
config.config.document.fileType; // docx
```

`forFile()` reads `fileType` off the name of the file and looks `documentType` up in the
formats the server answered with, so neither can contradict the other or the file. The
third argument is laid over what it derived, and its `document` is merged into the derived
one rather than replacing it. A config assembled by hand goes through the constructor
instead: `new DocumentServerConfig({ documentType, document, editorConfig })`.

The effective config is on `config`, validated and frozen, and the instance serializes as
that config, so `JSON.stringify(config)` is what goes into the page.

### What it refuses

Nearly every field of the editor config is optional in the types, while the document
server is strict about a handful of them. A `TypeError` is thrown for:

- a missing `document` or `documentType`, or a `documentType` no editor answers to;
- a `key` that is empty, longer than 128 characters, or carries anything outside
  `0-9`, `a-z`, `A-Z`, `-`, `.`, `_` and `=`;
- a `document.url` or an `editorConfig.callbackUrl` that is not an absolute `http` or
  `https` URL;
- a `title` longer than the 128 characters the server allows;
- the editor `events`, which are no part of a config that is serialized and signed.

`fileType` is normalized rather than refused: `".DOCX"` and `"DOCX"` both become `"docx"`.

### Signing

`sign()` answers with a copy of the config carrying a `token` over it, which is what the
editor is handed once the document server has a secret. The token covers the whole config
apart from itself, so a config that already carries one is signed anew rather than signed
over its own token.

```ts
const jwt = new DocumentServerJwt({ secret: process.env["JWT_SECRET"] ?? "" });
const signed = await config.sign(jwt);
```

### The events stay in the browser

The config travels to the browser as JSON, and the `events` of the editor API are
functions — they survive neither `JSON.stringify` nor a signature. The type the SDK takes,
`SignableConfig`, is the editor config without them, and a config that carries them anyway
is refused rather than quietly stripped. They are attached where the editor is built, on
top of the config that came from here:

```html
<script>
  const config = JSON.parse(document.getElementById("config").textContent);

  config.events = { onAppReady, onDocumentStateChange, onError };

  new DocsAPI.DocEditor("placeholder", config);
</script>
```

The script that defines `DocsAPI` is the one `getConfig()` names in `urls.api`, served by
the document server itself.

### Document keys

A key stands for one revision of a file, not for the file: the document server takes a
document from its cache whenever it sees a key it already knows, so a document the editors
saved has to be given a new one. `buildDocumentKey()` builds one out of the parts that
identify a revision in your storage:

```ts
buildDocumentKey("files/report 1.docx", 1732000000); // files-report-1.docx_1732000000
```

The parts are joined with `_`, and every character the server does not accept becomes `-`.
A key that would come out longer than the 128 characters the server allows is cut to fit
and given a fingerprint of the whole, so two long keys that differ only in their tail stay
apart.

[config-api]: https://api.onlyoffice.com/docs/docs-api/usage-api/config/
[doceditor-types]: https://www.npmjs.com/package/@onlyoffice/doceditor-types

## Conversion

`convert()` posts to `/converter`, the [conversion API][conversion-api] of the document
server, which downloads the source document from `url` and converts it:

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

The service answers `200 OK` whether the conversion succeeded or failed, so the status
proves nothing: the body either carries `fileUrl` and `endConvert`, or an `error` code
from `-1` to `-10` — `-5` incorrect password, `-8` invalid token, and so on. A body
carrying a code other than `0` rejects with a `ConversionError`, which holds it as `code`;
the codes are listed on `ConversionErrorCode`.

The request accepts every parameter the API documents — `thumbnail` for an image output,
`spreadsheetLayout` for a spreadsheet printed to PDF, `pdf.form` for a fillable form,
`watermark`, `documentLayout`, `documentRenderer`, `password`, `region`, `delimiter` and
`codePage` — each typed and documented on `ConvertRequest`:

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

`Accept: application/json` is sent for you; without it the service replies in XML. A
`content-type` among the configured `headers` is overridden rather than merged with, so a
stray value cannot corrupt the request.

### Synchronous and asynchronous conversion

By default the document server holds the connection open until the file is ready. A large
document can outlast `timeoutMs` — and the reverse proxy in front of the server has a
deadline of its own. `async: true` returns immediately with `endConvert: false` and a
`percent`; repeat the very same request, unchanged, until `endConvert` turns `true`:

```ts
const request: ConvertRequest = { async: true, filetype: "docx", key, outputtype: "pdf", url };

for (;;) {
  const result = await client.convert(request);

  if (result.endConvert) break;

  await new Promise((resolve) => setTimeout(resolve, 1000));
}
```

The `key` identifies the source document: reusing it returns the cached result, so a new
version of the same file needs a new key.

### Signing and cluster routing

When the document server is configured with a secret, the request has to carry a JWT — and
it takes one in either of two places, signed over two different payloads. In the body,
`token` signs the body itself; in a header, the signature covers the body wrapped as
`{ payload: … }`. [`DocumentServerJwt`](#jwt) signs both:

```ts
const jwt = new DocumentServerJwt({ secret });

// In the body, as a field of the request.
await client.convert({ ...request, token: await jwt.sign(request) });

// In a header, as the second argument.
await client.convert(request, await jwt.sign({ payload: request }));
```

Sending both is fine as long as each was signed over its own payload — handing the same
token to both places fails with `-8`. Omit the second argument and no header is sent at
all, which is what a server without a secret wants.

On a document server cluster the request is pinned to one node by a `shardkey` query
parameter carrying the document key, which keeps every call about one document on the
same node. Being a query parameter rather than a body field, it stays out of both signed
payloads. Sent always; versions before Docs 8.1 ignore it.

[conversion-api]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/

## Commands

`command()` posts to `/command`, the [command service][command-service], which manages a
document the editors already have open — and the files they left behind. The command is
picked by its `c` field, and each one takes its own parameters:

```ts
const result = await client.command({ c: "info", key: "Khirz6zTPdfd7" });

result.users; // ["6d5a81d0", "78e1e841"]
```

| Command            | Parameters          | Answers                      | Does                                               |
| ------------------ | ------------------- | ---------------------------- | -------------------------------------------------- |
| `deleteForgotten`  | `key`               | `key`                        | Removes a forgotten document.                      |
| `drop`             | `key`, `users`      | `key`                        | Disconnects users from co-editing.                 |
| `forcesave`        | `key`, `userdata`   | `key`                        | Saves the document without closing it.             |
| `getForgotten`     | `key`               | `key`, `url`                 | Asks where a forgotten document can be downloaded. |
| `getForgottenList` | —                   | `keys`                       | Lists the forgotten documents.                     |
| `info`             | `key`, `userdata`   | `key`, `users`               | Asks who has the document open.                    |
| `license`          | —                   | `license`, `quota`, `server` | Asks for the license and the quota spent.          |
| `meta`             | `key`, `meta.title` | `key`                        | Renames the document in every editor.              |
| `version`          | —                   | `version`                    | Asks for the version of the document server.       |

`CommandRequest` is a union discriminated on `c`, so a command is checked against its own
parameters — `{ c: "version", key }` does not compile, and `{ c: "meta", key }` without
`meta` does not either:

```ts
await client.command({ c: "meta", key, meta: { title: "Contract.docx" } });
await client.command({ c: "drop", key, users: ["6d5a81d0"] });
await client.command({ c: "forcesave", key, userdata: "before-download" });
```

`drop` without `users` disconnects everyone; versions before Docs 8.3 need the list.

The response is a single `CommandResponse` shape, since nothing in the body says which
command it answers — only `error` is always there, the rest depends on the command. And
`error` is always there even on success, where it is `0`. The codes run from `0` to `6`;
they are listed on `CommandErrorCode`, and a non-zero one rejects with a `CommandError`.

`4` is the exception: it says nothing had changed since the last save, which is an outcome
of `forcesave` rather than a failure, so it comes back on the result instead of throwing.

```ts
const result = await client.command({ c: "forcesave", key });

if (result.error === 4) {
  // The document had no unsaved changes.
}
```

`forcesave` returning `error: 0` only means the save was started: the file itself arrives at
your callback handler, with `forcesavetype` and the `userdata` you passed in.

A token is sent exactly as it is for a conversion — in the body as `token`, signing the body
itself, or in a header as the second argument, signing the body wrapped as `{ payload: … }`:

```ts
await client.command({ ...request, token: jwt.sign(request, secret) });
await client.command(request, jwt.sign({ payload: request }, secret));
```

The `shardkey` query parameter is added for the commands that carry a `key`, and left out
for `getForgottenList`, `license` and `version`, which are about the server rather than one
document.

[command-service]: https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/

## Downloading files

`getFile()` gets a file the document server keeps: the result of a conversion, a forgotten
document, the saved document and the changes a callback arrives with. It takes a path and
a query rather than a URL, the way every other method does, and sends them to the
configured `baseUrl`:

```ts
const file = await client.getFile("/cache/files/data/conv_key/output.pdf/output.pdf", {
  md5: "Zm9vYmFy",
  expires: "1735689600",
  filename: "output.pdf",
});

const bytes = new Uint8Array(await file.arrayBuffer());
```

The document server hands these locations out as absolute URLs — `fileUrl` in a conversion
response, `url` in a callback, `url` in the answer to `getForgotten` — so split one before
passing it on:

```ts
const link = new URL(result.fileUrl);

await client.getFile(link.pathname, Object.fromEntries(link.searchParams));
```

Splitting it rather than requesting it whole is what makes the URL usable at all when the
document server sits behind a reverse proxy: it answers with its own internal host, and
the default Docker setup returns `http://localhost/cache/files/…`, which is unreachable
from where the integration runs. Only the path and the query of that URL mean anything to
you; the host is the one you already configured.

No token is taken: these locations are signed by the document server itself and carry
their own expiry in the query, so no authorization header is sent. The configured
`headers` and `fetch` apply as they do everywhere else, and the `Response` comes back
unread, so a large file can be streamed rather than buffered:

```ts
await pipeline(Readable.fromWeb(file.body), createWriteStream("output.pdf"));
```

A status outside the 2xx range rejects with a `DocumentServerHttpError` before the body is
handed over, so the page a reverse proxy answers a missing file with never reaches the
stream and gets written out as the file.

`timeoutMs` is the one thing that behaves differently here: it bounds the wait for the
response and is then called off, so reading the body is not racing a deadline. A `signal`
of your own remains the way to cancel a download in progress. See
[timeoutMs](#timeoutms).

## JWT

`DocumentServerJwt` signs the tokens the document server expects, and checks the ones it
sends back. It brings no dependency of its own: the HMAC comes from WebCrypto, which every
runtime this SDK targets provides.

```ts
import { DocumentServerJwt } from "@onlyoffice/docs-integration-sdk";

const jwt = new DocumentServerJwt({ secret });
const token = await jwt.sign({ key: "Khirz6zTPdfd7", url: "https://example.com/contract.docx" });
```

`sign()` adds `iat` and `exp`, each unless the payload already carries it — a payload that
names its own lifetime keeps it. The default is five minutes; `expiresInSec` changes it,
on the signer or on the one call, and `null` leaves `exp` out so the token never expires:

```ts
const jwt = new DocumentServerJwt({ secret, expiresInSec: 60 });

await jwt.sign(payload); // expires in a minute
await jwt.sign(payload, { expiresInSec: 3600 }); // in an hour
await jwt.sign(payload, { expiresInSec: null }); // never
```

`algorithm` picks among `HS256`, the default, and `HS384` and `HS512`, for a server
configured to expect one of those instead.

What goes into the payload is what the endpoint is signed over, and it differs between the
body and the header — see [Signing and cluster routing](#signing-and-cluster-routing).

### Checking a token

`verify()` answers with what the token carries, and rejects with a `JwtError` when it
cannot be trusted. This is the check a `callbackUrl` handler owes: the document server
posts to it whenever a document is saved, and without it anybody who learns the URL can
post too.

```ts
try {
  const claims = await jwt.verify<CallbackPayload>(token);
} catch (error) {
  if (JwtError.is(error)) {
    // 403: error.kind says which check refused it
  }
}
```

`kind` is `malformed`, `algorithm`, `signature`, `expired` or `premature`. The errors of
the client are a separate family: `JwtError.is()` and `DocumentServerError.is()` never
answer `true` for the same value.

The algorithm is the one the signer is configured with. A token naming another in its
header is refused before anything is computed, rather than being checked the way it asks
to be — which is what keeps a token headed `alg: "none"` from passing. `exp` and `nbf` are
honoured when present, each has to be a number if it is there at all, and `iat` is read by
nobody. The payload is parsed only once the signature has matched.

`clockToleranceSec` is the leeway both claims get, in seconds, for a document server whose
clock runs apart from ours. It defaults to `0` and, like the lifetime, can be set on the
signer or on the one call:

```ts
const jwt = new DocumentServerJwt({ secret, clockToleranceSec: 30 });

await jwt.verify(token, { clockToleranceSec: 0 });
```

### One signer, one secret

The secret belongs to the signer rather than to the call, which is what lets the key be
imported once and reused by every token after it. A document server configured with
separate secrets for what it receives, what it sends and the editor session takes a signer
for each, and the one to sign with is then picked by naming it:

```ts
const inbox = new DocumentServerJwt({ secret: inboxSecret });
const outbox = new DocumentServerJwt({ secret: outboxSecret });

await client.convert(request, await inbox.sign({ payload: request }));
```

A server that uses one secret everywhere — the common case — needs one signer.

## Errors

A call rejects when the answer never came, when it is not the one the endpoint promises,
or when the document server reports a failure of its own:

| Error                      | `kind`         | Thrown when                                                                                            |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `DocumentServerHttpError`  | `"http"`       | The status is outside the 2xx range. Carries `status` and the beginning of the `body`.                 |
| `DocumentServerParseError` | `"parse"`      | A 2xx body is not the JSON the endpoint promises. Carries the `body` and the parse failure as `cause`. |
| `ConversionError`          | `"conversion"` | `/converter` answered `200 OK` with an `error` code other than `0`. Carries it as `code`.              |
| `CommandError`             | `"command"`    | `/command` answered with an `error` that is neither `0` nor `4`. Carries it as `code`.                 |
| `BuilderError`             | `"builder"`    | `/docbuilder` answered `200 OK` with an `error` code other than `0`. Carries it as `code`.             |

All five extend `DocumentServerError`, which carries the `response` they were read from.
Its body has already been consumed by the time the error is built, which is why a
truncated copy of it is on the error itself.

`code` keeps the documented codes as literals, so `-5` is autocompleted and a `case -5:`
narrows — but a code the service does not document stays a number rather than being forced
into the union. A `switch` over it is therefore never exhaustive, which is the truth of the
matter: a document server one version newer may answer with a code this SDK has never
heard of, and it arrives as `code` with `unrecognized error code` in the message rather
than as a type that promised it could not exist.

Each class recognizes its own through a static `is()`, and `DocumentServerError.is()` takes
any of the five:

```ts
try {
  await client.convert(request);
} catch (error) {
  if (ConversionError.is(error) && error.code === -5) {
    return askForThePassword();
  }

  if (DocumentServerHttpError.is(error) && error.status >= 500) {
    return retryLater();
  }

  throw error;
}
```

`instanceof` works too, and is the shorter thing to write — but it compares prototypes, and
a package that ships ESM and CJS side by side is loaded twice as soon as one part of an
application imports it and another requires it. The two copies carry two distinct classes,
so an error thrown by one fails `instanceof` against the other, in a way that shows up in
somebody else's bundler rather than in your tests. `is()` asks for a mark the copies share
instead, so use it wherever the error crosses a package boundary.

`kind` is the same question answered as a value, which is what a `switch` or a log line
wants. `DocumentServerError.is()` narrows to a union discriminated on it, so every branch
gets the fields of its own error:

```ts
if (DocumentServerError.is(error)) {
  switch (error.kind) {
    case "http":
      return report(error.status);
    case "parse":
      return report(error.body);
    case "conversion":
    case "command":
    case "builder":
      return report(error.code);
  }
}
```

`DocumentServerParseError` is the one worth expecting even from a healthy integration: a
reverse proxy that answers `200 OK` with a page of its own would otherwise surface as a
bare `SyntaxError` from `JSON.parse`, with nothing to say where it came from.

Network failures and timeouts are left exactly as `fetch` raises them — a `TypeError` with
the reason in `error.cause`, or a `DOMException` whose `name` is `"TimeoutError"`. Wrapping
those would only hide the `cause`. See [timeoutMs](#timeoutms).

Retries, polling and backoff are yours to decide on: the SDK sends one request per call.

Only the five above are thrown by the SDK itself, so nothing else that comes out of a call
was invented here. Two outcomes deliberately do not throw. `healthcheck()` answers `false` for a failing
status rather than rejecting, since a server that is down is the answer it was asked for,
and `error: 4` from `forcesave` comes back on the result, since nothing to save is an
outcome rather than a failure.

## The raw client

`client.raw` holds the same seven endpoints, each answering with the untouched `Response`
and none of them throwing on what the document server says:

```ts
const response = await client.raw.convert(request);

response.ok;
response.headers.get("x-request-id");

const result = (await response.json()) as ConvertResponse;
```

It is the same instance the typed client sends its own requests through — the options, the
headers, the deadline and the `fetch` are the ones you configured — so the two may be
mixed freely. Reach for it when a status or a header matters to you, when a body has to be
read some other way, or when an error is a value in your codebase rather than an
exception. `client.options` and `client.raw.options` are the same frozen object.

`getFile()` differs the least of the seven: a file is a stream, so on a 2xx the `Response`
comes back unread from both. Only a failing status parts them — the typed one rejects, the
raw one hands the response over.

## Options

| Option                | Default            | Description                                             |
| --------------------- | ------------------ | ------------------------------------------------------- |
| `baseUrl`             | —                  | Base URL of the document server. Required.              |
| `timeoutMs`           | `30000`            | Request timeout.                                        |
| `headers`             | `{}`               | Headers sent with every request.                        |
| `authorizationHeader` | `"Authorization"`  | Header a conversion token is sent in.                   |
| `authorizationPrefix` | `"Bearer "`        | Put before the token in that header.                    |
| `fetch`               | `globalThis.fetch` | Custom `fetch`: proxy, mTLS, retries, logging, mocking. |

`client.options` holds the effective settings — validated, with defaults applied, and
frozen. It is a copy, so changing the object you passed in has no effect afterwards:

```ts
client.options;
// { baseUrl: "https://docs.example.com", timeoutMs: 5000, headers: {…},
//   authorizationHeader: "Authorization", authorizationPrefix: "Bearer ", fetch: ƒ }
```

### baseUrl

The base URL is validated once, in the constructor, and stored in canonical form:
surrounding whitespace, a trailing slash, a query and a fragment are dropped, and the
host is lowercased. A path prefix is preserved, so a document server behind
`https://example.com/office/` keeps working.

An invalid value throws a `TypeError` immediately rather than failing later at request
time. Note that the URL parser accepts any scheme, so the protocol is checked separately:
`htp://host` is a valid URL but not a usable base URL.

```ts
new DocumentServerClient({ baseUrl: "docs.example.com" });
// TypeError: baseUrl must be an absolute URL, got: docs.example.com

new DocumentServerClient({ baseUrl: "htp://docs.example.com" });
// TypeError: baseUrl must use http or https, got: htp:
```

### timeoutMs

Neither the fetch standard nor Node gives a request deadline: undici only aborts a
connection that never opens (~10 s) or a response that stays silent for 5 minutes, so a
hung server would otherwise hold the call indefinitely. Hence the 30 s default.

A request that runs out of time rejects with a `DOMException` whose `name` is
`"TimeoutError"`. A server that cannot be reached rejects with `TypeError: fetch failed`;
the reason is in `error.cause` — on Node an `AggregateError` carrying `code`, such as
`"ECONNREFUSED"`.

The deadline covers the whole exchange, reading the response body included — an abort
errors the body stream, not just the wait for the headers. That is what you want from the
endpoints that answer with a small JSON body, and wrong for `getFile()`, whose body is a
file of any size: a download slower than the deadline would fail halfway through, however
healthy the server. So `getFile()` alone calls the deadline off once the response has
arrived, and the body may then be read for as long as it takes.

Nothing else changes for it: the deadline still governs the wait for the response, and a
`signal` of your own stays armed throughout, which is how a download in progress is
cancelled. A download that stalls mid-body is no longer cut short by the SDK, though —
on Node undici ends it after 5 minutes of silence, and elsewhere a `signal` is the only
way out.

The value is validated in the constructor, the way `baseUrl` is, and has to be a whole
number of milliseconds from `1` to `2147483647`, the largest delay a timer takes:

```ts
new DocumentServerClient({ baseUrl: "https://docs.example.com", timeoutMs: 1.5 });
// TypeError: timeoutMs must be an integer from 1 to 2147483647, got: 1.5
```

A fractional value is the one worth guarding against: `(2.5 * 1000) / 3` looks harmless
and used to fail every request with a `RangeError` from inside the timer.

### authorizationHeader and authorizationPrefix

Both mirror the document server's own `token.outbox.header` and `token.outbox.prefix`
settings, and are read only when `convert()` or `command()` is given a token. The prefix is joined to the
token as it stands, so the trailing space belongs to the default value and an empty string
leaves the token bare:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  authorizationHeader: "X-Docs-Token",
  authorizationPrefix: "",
});

await client.convert(request, token); // X-Docs-Token: <token>
```

A same-named header among the configured `headers` is left alone until a token is passed,
and is then overridden rather than merged with.

### fetch

Supplying your own `fetch` is the extension point for everything the SDK does not do
itself — a proxy or mTLS agent, retries, logging, tracing, request mocking:

```ts
const client = new DocumentServerClient({
  baseUrl: "https://docs.example.com",
  fetch: (url, init) => {
    console.log("->", url);
    return fetch(url, init);
  },
});
```

When the option is omitted, the global `fetch` is looked up on each call rather than
captured at construction, so a `fetch` patched later — by msw or an instrumentation
agent — is still picked up.

## Per-request options

Every method takes a last, optional argument that overrides the client settings for that
one call:

```ts
await client.convert(request, token, {
  signal: controller.signal,
  timeoutMs: 120_000,
  headers: { "x-request-id": requestId },
});
```

| Option      | Description                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| `signal`    | Cancels the call. The deadline still applies alongside it.                      |
| `timeoutMs` | Deadline for this call, in place of the configured one. Validated the same way. |
| `headers`   | Headers laid over the configured ones. Names are matched case-insensitively.    |

`signal` is joined with the deadline through `AbortSignal.any()`, so whichever fires first
aborts the request: a cancelled call rejects with the reason the signal carries, a call
that runs out of time with a `"TimeoutError"`. Passing a signal therefore does not disarm
the timeout — pass a larger `timeoutMs` for a conversion expected to be slow.

The headers are applied last, over the configured ones and over the `content-type`,
`accept` and authorization headers `convert()` and `command()` set themselves. Since the match ignores case,
`{ "X-Tenant": "globex" }` replaces a configured `x-tenant` rather than adding a second
copy of it.

## Project layout

```
src/
  index.ts            public exports
  client/index.ts     DocumentServerClient, the typed layer
  client/raw.ts       DocumentServerRawClient, the transport
  client/errors.ts    DocumentServerError and the rest
  client/options.ts   ClientOptions and RequestOptions
  client/meta.ts      server configuration and formats
  client/convert.ts   conversion request and response
  client/command.ts   command request and response
  client/builder.ts   document builder request and response
  config/index.ts     DocumentServerConfig, the editor config
  config/key.ts       buildDocumentKey
  config/types.ts     the editor config types, from @onlyoffice/doceditor-types
  formats/index.ts    DocumentServerFormats, the format lookup
  jwt/index.ts        DocumentServerJwt, the token signer
  jwt/errors.ts       JwtError and the kinds of refusal
test/
  client.test.ts
  config.test.ts
  formats.test.ts
  jwt.test.ts
docs/
  README.md           generated API reference, by kind
typedoc.json          how it is generated
```

## Development

```sh
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run lint        # eslint
npm run format      # prettier --write
npm run build       # tsup -> dist (ESM + CJS + .d.ts)
npm run docs        # typedoc -> docs (markdown API reference)
```

## Document builder

`docbuilder()` posts to `/docbuilder`, the [document builder API][builder-api], which downloads
a `.js` script from `url` and runs it against the Office JavaScript API to generate files:

```ts
const result = await client.docbuilder({ url: "https://example.com/contract.js" });

result.urls; // { "output.docx": "https://docs.example.com/…/output.docx" }
```

The script decides what is produced: each `builder.SaveFile()` in it adds an entry to
`urls`, keyed by the file name it was saved under, so one build can return a document and
a spreadsheet at once. As with a conversion, the service answers `200 OK` either way — the
body carries `urls` or an `error` code, one of `-1`, `-2`, `-3`, `-4`, `-6` and `-8`,
listed on `BuilderErrorCode` and thrown as a `BuilderError`.

Values for the script travel in `argument`, where it reads them back through its `Argument`
global:

```ts
await client.docbuilder({
  url: "https://example.com/contract.js",
  argument: { customer: "Acme", total: 1499, items: ["License", "Support"] },
});
```

### Synchronous and asynchronous builds

By default the document server holds the connection open until the files are ready. A
long-running script can outlast `timeoutMs`, so `async: true` returns at once with
`end: false` and the `key` the service minted for the build; repeat the request with that
key — and nothing else — until `end` turns `true`:

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

`BuilderRequest` is a union of the two: a request that starts a build needs `url`, and one
that collects the result needs `key`, so neither can be sent empty. The `shardkey` query
parameter carries the build key, which keeps every poll on the node running the build; the
first request has no key yet and is sent without it.

Signing works exactly as it does elsewhere — in the body as `token`, signing the body
itself, or in a header as the second argument, signing the body wrapped as `{ payload: … }`:

```ts
await client.docbuilder({ ...request, token: jwt.sign(request, secret) });
await client.docbuilder(request, jwt.sign({ payload: request }, secret));
```

[builder-api]: https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/
