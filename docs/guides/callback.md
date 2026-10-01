# Handling callbacks

The document server posts to the `callbackUrl` of the [editor config](editor.md) whenever
something happens to the document: a user connects, the last editor closes, a save is requested.
`DocumentServerCallback` checks the token of the request, tells you what happened and builds the
reply the document server expects.

- [A complete handler](#a-complete-handler)
- [Parse the request](#parse-the-request)
- [Events](#events)
- [Check the token](#check-the-token)
- [Check the document key](#check-the-document-key)
- [Reply to the document server](#reply-to-the-document-server)
- [Invalid requests](#invalid-requests)

## A complete handler

```ts
import { buildDocumentKey } from "@onlyoffice/docs-integration-sdk/config";
import { DocumentServerCallback } from "@onlyoffice/docs-integration-sdk/callback";
import { splitFileUrl } from "@onlyoffice/docs-integration-sdk/client";

export async function POST(request: Request): Promise<Response> {
  const fileId = new URL(request.url).searchParams.get("fileId");
  const callback = await DocumentServerCallback.fromRequest(request, { verifier: outbox });
  const file = await storage.find(fileId);

  if (file === undefined) {
    return new Response(null, { status: 403 });
  }

  const { event } = callback;

  if (event.key !== (await buildDocumentKey(instanceId, file.id, file.version))) {
    return new Response(null, { status: 403 });
  }

  const reply = await callback.handle({
    save: async ({ url }) => {
      const { path, query } = splitFileUrl(url, publicUrl);
      const download = await client.getFile(path, query);

      await storage.saveVersion(file.id, download.body);
    },
  });

  return Response.json(reply);
}
```

What each step does:

1. `fromRequest()` checks the token and parses the body. See [Check the token](#check-the-token).
2. The file is found by the ID you put into `callbackUrl`, not by the document key.
3. The key is compared with the current revision of the file. See
   [Check the document key](#check-the-document-key).
4. `handle()` runs your handler and returns the reply. See
   [Reply to the document server](#reply-to-the-document-server).
5. The file is downloaded with [`getFile()`](files.md).

## Parse the request

`fromRequest()` takes a fetch `Request`, which Next.js, Hono, Deno and edge runtimes give you.

If your framework parses the body itself, pass the parts to `parse()`. The body can be parsed
JSON, text or bytes. The headers can be `Headers` or a plain Node headers object:

```ts
app.post("/callback", express.json(), async (req, res) => {
  const callback = await DocumentServerCallback.parse(
    { body: req.body, headers: req.headers },
    { verifier: outbox },
  );

  const reply = await callback.handle(handlers);

  res.json(reply);
});
```

## Events

`callback.event` is the request body with the field names the document server uses, plus a
`kind` field for its `status`. What each status and field means is described in the
[callback handler documentation][callback-handler].

| `status` | `kind`              | What to do                          |
| -------- | ------------------- | ----------------------------------- |
| `1`      | `"editing"`         | Nothing, or track who is editing.   |
| `2`      | `"save"`            | Download `url` and store it.        |
| `3`      | `"save-error"`      | Report it; `url` may be missing.    |
| `4`      | `"closed"`          | Nothing.                            |
| `6`      | `"forcesave"`       | Download `url` and store a version. |
| `7`      | `"forcesave-error"` | Report it.                          |
| other    | `"unknown"`         | Look at `status`.                   |

A `switch` over `kind` narrows the type. `url` is a `string` on `save` and `forcesave` (a
callback with one of these statuses and no `url` is refused) and optional on the rest.

> [!NOTE]
> Status `6` can come even if the editor config never enables `customization.forcesave`: from the
> `forcesave` command, a submitted form or the autosave timer of the document server. See
> [force saving][force-saving].
> [`forcesavetype`][callback-forcesavetype] says which.

## Check the token

With a JWT secret configured, the document server signs every callback, in one of two places:

- **[In the body][token-in-body-outgoing]:** `token` signs the callback itself.
- **[In a header][token-in-header-outgoing]:** `Authorization: Bearer …` by default, or the
  header set by `authorizationHeader` and `authorizationPrefix` of the
  [signer](jwt.md#verify-a-token-from-a-header). The token signs the callback wrapped as
  `{ payload: … }`.

The body token is checked first. The header is checked only if the body has no token.

After a token matches, the SDK uses **what the token carries** as the callback and ignores the
body. An unsigned field could be written by anyone who knows the URL, so a `url` pointing
somewhere else never reaches your download.

`verifier` is required:

- Pass [`DocumentServerJwt`](jwt.md) configured with the outbox secret, or any
  `CallbackVerifier`: an object with a `verify(token)` method that resolves to the token's
  payload, and a `readHeader(headers)` method that returns the header token, or `undefined`.
- Pass `null` for a document server without a secret. Unsigned callbacks are accepted, and a
  token they carry is not checked or trusted. You have to write `null` explicitly, so you can't
  turn off the check by forgetting an option.

## Check the document key

The token signs the body, not the URL the callback was posted to. Someone could post a valid
callback for one file to the URL of another. So before storing anything, compare `event.key`
with the key of the file's current revision, as the [complete handler](#a-complete-handler) does.
Build that key from the same parts the editor was opened with: other parts give another key, and
every callback is refused.

## Reply to the document server

```ts
const reply = await callback.handle(handlers);

return Response.json(reply);
```

`handle()` runs the handler for the event and returns:

- `DocumentServerCallback.ok`, `{"error":0}`, when the handler finished;
- `DocumentServerCallback.fail`, `{"error":1}`, when the handler threw or rejected.

The [callback handler documentation][callback-reply] requires `{"error":0}`.

> [!IMPORTANT]
> On any reply other than `{"error":0}`, the document editor shows an error message.

`onError` is called with the failure before the reply is returned:

```ts
await callback.handle(handlers, {
  onError: (error, event) => logger.error({ error, key: event.key }, "callback failed"),
});
```

Handlers:

- **`save` is required.** The types refuse handlers without it: status `2` carries the edited
  document to store.
- **`forcesave` is optional**, for an integration that never forces a save. A status `6` without
  a `forcesave` handler is answered with `fail`, and `onError` gets a `CallbackError` of kind
  `"unhandled"`, so the missing handler shows up in your log instead of as a version silently
  not stored.
- **Any other kind** without a handler is answered with `ok`.

## Invalid requests

`parse()` and `fromRequest()` reject with a `CallbackError`:

| `kind`        | Thrown when                                                          |
| ------------- | -------------------------------------------------------------------- |
| `"body"`      | The body is not a callback, for example not JSON or without a `key`. |
| `"token"`     | A verifier is set and the callback carries no token.                 |
| `"signature"` | The verifier rejected the token. Its error is the `cause`.           |

The exact conditions are in the
[`parse()` reference](../api/callback/classes/DocumentServerCallback.md#parse).

A fourth kind, `"unhandled"`, never comes from `parse()` or `fromRequest()`. It is what
`handle()` passes to `onError` for a `6` without a `forcesave` handler.

Such a request did not come from the document server, or not in a shape it sends. Answer it with
`400` or `403`, not with `fail`:

```ts
try {
  callback = await DocumentServerCallback.fromRequest(request, { verifier: outbox });
} catch (error) {
  if (CallbackError.is(error)) {
    return new Response(null, { status: error.kind === "body" ? 400 : 403 });
  }

  throw error;
}
```

[callback-handler]: https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/
[callback-forcesavetype]: https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#forcesavetype
[token-in-body-outgoing]: https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-body/#outgoing-requests
[token-in-header-outgoing]: https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-header/#outgoing-requests
[force-saving]: https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/saving-file/#force-saving
[callback-reply]: https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#response-from-the-document-storage-service
