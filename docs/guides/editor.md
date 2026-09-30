# Opening an editor

`DocumentServerConfig` builds the [config][config-api] that `DocsAPI.DocEditor` is created with
in the browser. Build it on your server, where the JWT secret is, and send the result to the
page.

- [Build the config](#build-the-config)
- [What the SDK fills in for you](#what-the-sdk-fills-in-for-you)
- [Permissions](#permissions)
- [Callback URL and mode](#callback-url-and-mode)
- [User](#user)
- [Sign the config](#sign-the-config)
- [Open the editor in the browser](#open-the-editor-in-the-browser)
- [Document keys](#document-keys)
- [Validation errors](#validation-errors)

## Build the config

```ts
import {
  buildDocumentKey,
  DocumentServerConfig,
  DocumentServerFormats,
} from "@onlyoffice/docs-integration-sdk";

const formats = new DocumentServerFormats(await client.getFormats());

const config = new DocumentServerConfig(
  {
    document: {
      key: await buildDocumentKey(instanceId, file.id, file.version),
      title: "Report.docx",
      url: "https://storage.example.com/report.docx",
      permissions: { edit: user.mayEdit(file) },
    },
    editorConfig: {
      callbackUrl: `https://app.example.com/callback?fileId=${file.id}`,
      lang: "de",
      user: { id: "u-17", name: "Anna Schmidt" },
    },
  },
  formats,
);

config.config.documentType; // "word"
config.config.document.fileType; // "docx"
```

The constructor takes:

1. The config input: the file, the permissions on it and the whole `editorConfig`. The fields
   are typed by [`@onlyoffice/doceditor-types`][doceditor-types]. Its version follows the
   document server version (`9.4.2` is Docs `9.4.0`), not the version of this SDK.
2. A format lookup: [`DocumentServerFormats`](formats.md), or any object with a
   `getFormat(extension)` method that returns the `type` and `actions` of a format.

The result is on `config.config`. It is validated, completed and deeply frozen. The input is
copied, so later changes to it have no effect. The instance serializes as the config, so
`JSON.stringify(config)` gives you what to put on the page.

## What the SDK fills in for you

The document server decides some fields from the file format. You don't pass them. The types
declare them as `never`. If a value gets there anyway (from JavaScript or through a cast), the
SDK replaces it with the derived value:

| Field               | Derived from                                        |
| ------------------- | --------------------------------------------------- |
| `document.fileType` | the extension of `title`, in lower case             |
| `documentType`      | the editor the document server opens that format in |

## Permissions

`document.permissions.edit` is required. Whether a file may be changed is a decision of your
system, so the SDK has no default for it.

The SDK then fits the permissions to the format. It silently sets a permission to `false` if the
format does not allow it. It leaves out a permission you did not pass.

| Permission     | Kept when the format allows |
| -------------- | --------------------------- |
| `edit`         | `edit` or `lossy-edit`      |
| `review`       | `review`                    |
| `comment`      | `comment`                   |
| `fillForms`    | `fill`                      |
| `modifyFilter` | `customfilter`              |

For example, `{ edit: true }` for an `ett` file becomes `{ edit: false }`, because the editors
can only view `ett`.

The other permissions (`download`, `print`, `copy`, `chat` and so on) do not depend on the
format. They are kept as you passed them.

## Callback URL and mode

The document server posts document changes to `callbackUrl`. See [Handling callbacks](callback.md).

`editorConfig.mode` is kept as you passed it. It decides what happens to `callbackUrl`:

- **`"edit"` mode (default) and the user can change the document** (`edit`, `review`, `comment`
  or `fillForms` is `true` after fitting): `callbackUrl` is kept and **required**.
- **Otherwise** (`"view"` mode, or no permission left to change anything): `callbackUrl` and
  `customization.forcesave` are removed.

> [!TIP]
> The document key changes with every save, so the callback can't find the file by it. Put the
> file ID in `callbackUrl` instead. The signed config protects it from changes on the way.

## User

`editorConfig.user` is optional. Leave it out for a visitor your system doesn't know, for
example someone viewing a public link.

If you pass `user`, it needs an `id`. The document server uses it to:

- tell co-authors apart;
- name the author of changes: the `users` and `actions[].userid` of a callback, and the `users`
  of the `info` command;
- count users against the license.

> [!IMPORTANT]
> Give the same user the same `id` every time. Use a hash or an identifier of your own. Never use
> an email or a real name: the [documentation][config-editor-user] warns against that.
>
> For a visitor who isn't signed in but comes back, keep the `id` in their session. A new `id`
> on every visit counts as a new user in the license.

## Sign the config

When the document server has a JWT secret, the editor needs a signed config. `sign()` returns a
copy of the config with a `token` field:

```ts
const jwt = new DocumentServerJwt({ secret: process.env["DOCS_JWT_SECRET"] ?? "" });
const signed = await config.sign(jwt);
```

The token covers the whole config except the token itself. A config that already has a
`token` is signed again from scratch.

`sign()` takes [`DocumentServerJwt`](jwt.md) or any object with a `sign(payload)` method that
resolves to a token, for example a signer backed by a key vault.

## Open the editor in the browser

Load `api.js` from the document server. Its path is `urls.api` of
[`getConfig()`](formats.md#server-configuration). Serve the signed config from an endpoint of
yours, for example as `Response.json(signed)`, and create the editor from it:

```html
<div id="placeholder"></div>
<script src="https://docs.example.com/web-apps/apps/api/documents/api.js"></script>
<script type="module">
  const config = await fetch("/editor-config?fileId=17").then((response) => response.json());

  config.events = { onAppReady, onDocumentStateChange, onError };

  new DocsAPI.DocEditor("placeholder", config);
</script>
```

> [!NOTE]
> Editor `events` are functions. They survive neither `JSON.stringify` nor a signature, so
> `ConfigInput` has no field for them. Add them in the browser, as above.

## Document keys

A key identifies **one revision** of a file, not the file: a saved document needs a new key,
and everybody who opens the same revision must get the same key to meet in one editing session.
The rules are in the [documentation][config-document-key].

`buildDocumentKey()` builds a key from the parts that identify a revision in your storage:

```ts
await buildDocumentKey(instanceId, file.id, file.version); // 43 characters of base64url
```

How it works:

- The key is the SHA-256 of the parts, in base64url. It only uses characters the server accepts
  and always fits into 128 characters.
- Different parts always give different keys, including `("a_b", "c")` and `("a", "b_c")`. The
  same parts always give the same key, also after a restart.
- A number and its string form count as the same part.
- A part that is neither a string nor a finite number, such as `undefined` or `NaN`, is refused.
  Otherwise every revision would get the same key.

Choosing the parts:

- **One part must change with every write:** a version counter, an etag, a content hash. A
  modification time in seconds is not enough: two saves within one second would share a key.
- **Include the instance or tenant** if one document server serves several instances of your
  system. Otherwise two files with the same ID in two instances end up in the same session.

A session keeps its key until it closes, and everyone who joins it must get that key. So a
version stored on a force save (status `6`) is a copy. The revision, and the key built from it,
moves on only with the save on status `2`.

To check a callback's key and to deal with a save posted twice, see
[Handling callbacks](callback.md#check-the-document-key).

## Validation errors

The constructor throws a `ConfigError`. `field` names the refused path, for example
`"document.title"`, and `kind` says why:

- `"unsupported"`: no editor of the document server opens the format, for example `png`;
- `"invalid"`: a field is missing or has a value the document server would reject, such as a
  `title` without an extension or a `key` longer than 128 characters.

```ts
try {
  config = new DocumentServerConfig(input, formats);
} catch (error) {
  if (ConfigError.is(error) && error.kind === "unsupported") {
    return offerDownload(file);
  }

  throw error;
}
```

The full list of checks is in the
[constructor reference](../api/config/classes/DocumentServerConfig.md#constructor).
`ConfigError.is()` also recognizes an error from a second copy of the package.

[config-api]: https://api.onlyoffice.com/docs/docs-api/usage-api/config/
[config-editor-user]: https://api.onlyoffice.com/docs/docs-api/usage-api/config/editor/#user
[config-document-key]: https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/#key
[doceditor-types]: https://www.npmjs.com/package/@onlyoffice/doceditor-types
