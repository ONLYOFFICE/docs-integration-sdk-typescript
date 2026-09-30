# Server configuration and formats

- [Server configuration](#server-configuration)
- [Formats](#formats)
- [Look up a format](#look-up-a-format)

## Server configuration

`getConfig()` calls `/meta/config`, where the document server describes itself:

```ts
const config = await client.getConfig();

config.authorization; // { header: "Authorization", prefix: "Bearer " }
config.urls.api; // /web-apps/apps/api/documents/api.js
config.limits.maxFileSize; // 104857600
config.langs; // ["ar", "az", …, "zh-TW"]
```

| Field                | What it is                                                         |
| -------------------- | ------------------------------------------------------------------ |
| `authorization`      | the header the server expects a JWT in                             |
| `urls`               | the paths of its endpoints, including `api.js` for the editor page |
| `limits.maxFileSize` | the largest file it accepts                                        |
| `langs`              | the languages the editor is translated into                        |

> [!TIP]
> Set the client options `authorizationHeader` and `authorizationPrefix` to the values of
> `authorization`. A server configured with its own header name rejects a token sent under the
> default one. See [Client options](client.md#authorizationheader-and-authorizationprefix).

This endpoint describes the server, not a document, so it takes no token and has no error codes.
It fails only on a status outside 2xx, with a `DocumentServerHttpError`, or on a body that is
not a JSON object, with a `DocumentServerParseError`.

## Formats

`getFormats()` calls `/meta/formats`, the list of formats the server knows:

```ts
const formats = await client.getFormats();
const docx = formats.find((format) => format.name === "docx");

docx?.type; // "word"
docx?.actions; // ["view", "edit", "review", "comment", "encrypt"]
docx?.convert; // ["bmp", "docm", …, "txt"]
docx?.mime; // ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
```

| Field     | What it is                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `type`    | the editor the format opens in: the `documentType` of the editor config                                                    |
| `actions` | what that editor may do: `edit`, `fill`, `comment`, `review`, `auto-convert` (a legacy format converted on open) and so on |
| `convert` | the extensions you can pass as `outputtype` to convert this format                                                         |
| `mime`    | the MIME types the format is served under                                                                                  |

> [!NOTE]
> Formats that only come out of a conversion (images, `pdfa`, `zip` and others) have an empty
> `type` and no actions. So when you search the list by extension, skip them instead of taking
> the first match. `DocumentServerFormats` does that for you.

## Look up a format

`DocumentServerFormats` indexes the list by extension:

```ts
import { DocumentServerFormats } from "@onlyoffice/docs-integration-sdk";

const formats = new DocumentServerFormats(await client.getFormats());

formats.getDocumentType("report.docx"); // "word"
formats.isEditable("docx"); // true
formats.isFillable("pdf"); // true
formats.isConvertibleTo("docx", "pdf"); // true
formats.getConversions("xlsx"); // ["csv", "ods", "pdf", …]
formats.getFormatsByMime("application/pdf"); // [{ name: "pdf", … }]
```

Extensions are matched case-insensitively, with or without the dot. Of a file name, only what
follows the last dot counts. So `"docx"`, `".DOCX"` and `"/files/Q3 Report.docx"` are the
same lookup.

| Method                       | Returns                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `getFormat(ext)`             | The `Format`, or `undefined` for an extension the server doesn't know.    |
| `hasFormat(ext)`             | Whether the extension is known.                                           |
| `getDocumentType(ext)`       | The editor it opens in, which is the `documentType` of the editor config. |
| `getActions(ext)`            | What the editors may do with it.                                          |
| `can(ext, action)`           | Whether they may do that action.                                          |
| `isOpenable(ext)`            | Whether any editor opens it, in any mode.                                 |
| `isViewable(ext)`            | `view`.                                                                   |
| `isEditable(ext)`            | `edit`.                                                                   |
| `isLossyEditable(ext)`       | `lossy-edit`: editing loses what the format can't store.                  |
| `isFillable(ext)`            | `fill`: a form that is filled in, not edited.                             |
| `isCommentable(ext)`         | `comment`.                                                                |
| `isReviewable(ext)`          | `review`.                                                                 |
| `isAutoConvertable(ext)`     | `auto-convert`: converted on open, like the legacy `doc`.                 |
| `isEncryptable(ext)`         | `encrypt`.                                                                |
| `getConversions(ext)`        | The extensions it converts to, as `outputtype` takes them.                |
| `isConvertibleTo(from, to)`  | Whether the conversion API converts one into the other.                   |
| `getMimes(ext)`              | The MIME types it is served under.                                        |
| `getFormatsByMime(mime)`     | The formats served under a MIME type.                                     |
| `getFormatsByType(type)`     | The formats one editor opens, or the output-only ones for `""`.           |
| `getExtensions()`            | Every extension in the list, without the dots.                            |
| `all`, `[Symbol.iterator]()` | The list itself, frozen, in the server's order.                           |
| `size`                       | How many different extensions the list covers.                            |

Details:

- A format is openable when it has a `type`, whatever its actions. That is what `isOpenable()`
  checks.
- `getDocumentType()` returns `undefined` both for an unknown extension and for one no editor
  opens. That is exactly what the editor config needs.
- If two entries share an extension, `getFormat()` returns the one an editor opens, not the
  first match.

**Caching.** The list depends on the document server version and license. An instance holds one
answer of `/meta/formats`; to see a format the server has learned since, fetch the list again.
The class sends no requests, so it works just as well with a list cached in your application.
