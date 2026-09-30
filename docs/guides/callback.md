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
  const callback = await DocumentServerCallback.fromRequest(request, { verifier: inbox });
  const file = await storage.find(fileId);

  if (file === undefined) {
    return new Response(null, { status: 403 });
  }

  const { event } = callback;

  if (event.key !== (await buildDocumentKey(instanceId, file.id, file.version))) {
    if (event.kind === "save" && (await storage.hasVersionSavedFrom(file.id, event.key))) {
      return Response.json(DocumentServerCallback.ok);
    }

    return new Response(null, { status: 403 });
  }

  const reply = await callback.handle({
    save: async ({ key, url }) => {
      const { path, query } = splitFileUrl(url, publicUrl);
      const download = await client.getFile(path, query);

      await storage.saveVersion(file.id, download.body, { savedFrom: key });
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
    { verifier: inbox },
  );

  res.json(await callback.handle(handlers));
});
```

## Events

`callback.event` is the request body with the field names the document server uses, plus a
`kind` field:

| `status` | `kind`              | What happened                                           | What to do                          |
| -------- | ------------------- | ------------------------------------------------------- | ----------------------------------- |
| `1`      | `"editing"`         | A user connected or disconnected; `actions` says which. | Nothing, or track who is editing.   |
| `2`      | `"save"`            | The last editor closed and the document changed.        | Download `url` and store it.        |
| `3`      | `"save-error"`      | The document server failed to build the document.       | Report it; `url` may be missing.    |
| `4`      | `"closed"`          | The last editor closed and nothing changed.             | Nothing.                            |
| `6`      | `"forcesave"`       | A save was requested while the document is edited.      | Download `url` and store a version. |
| `7`      | `"forcesave-error"` | That save failed.                                       | Report it.                          |
| other    | `"unknown"`         | A status this SDK doesn't know yet.                     | Look at `status`.                   |

A `switch` over `kind` narrows the type. `url` is a `string` on `save` and `forcesave` (a
callback with one of these statuses and no `url` is refused) and optional on the rest.

`forcesavetype` says what requested a force save:

| `forcesavetype` | Source                                             |
| --------------- | -------------------------------------------------- |
| `0`             | the `forcesave` [command](commands.md)             |
| `1`             | the save button                                    |
| `2`             | the autosave timer in the document server settings |
| `3`             | a submitted form; its data is at `formsdataurl`    |

> [!NOTE]
> Status `6` can come even if the editor config never enables `customization.forcesave`: from the
> `forcesave` command, a submitted form or the autosave timer of the document server.

## Check the token

With a JWT secret configured, the document server signs every callback, in one of two places:

- **In the body:** `token` signs the callback itself.
- **In a header:** `Authorization: Bearer …` by default, or the header named by
  `authorizationHeader` and `authorizationPrefix`. The token signs the callback wrapped as
  `{ payload: … }`.

The body token is checked first. The header is checked only if the body has no token.

After a token matches, the SDK uses **what the token carries** as the callback and ignores the
body. An unsigned field could be written by anyone who knows the URL, so a `url` pointing
somewhere else never reaches your download.

`verifier` is required:

- Pass [`DocumentServerJwt`](jwt.md) configured with the inbox secret, or any object with a
  `verify(token)` method that resolves to the token's payload.
- Pass `null` for a document server without a secret. Unsigned callbacks are accepted, and a
  token they carry is not checked or trusted. You have to write `null` explicitly, so you can't
  turn off the check by forgetting an option.

## Check the document key

The token signs the body, not the URL the callback was posted to. Someone could post a valid
callback for one file to the URL of another. So before storing anything, compare `event.key`
with the key of the file's current revision, as the [complete handler](#a-complete-handler) does.

**The save on status `2` can come twice.** If `{"error":0}` never reaches the document server
(the connection broke, the request timed out), it posts the same `2` again, with the key of the
revision the file has just moved on from. If you refuse it, it is posted again and again until
the document server gives up, although nothing is lost.

To handle this:

1. With each version stored on `2`, record the key it was saved from.
2. When a `2` comes with such a recorded key, answer `ok` instead of refusing it.

> [!WARNING]
> Don't simply accept the key that came before the current one. The revision may have changed some
> other way, for example a new version uploaded while the document was open. That session would
> then be answered `ok` and its changes dropped.

## Reply to the document server

The document server treats `{"error":0}` as "the callback is handled" and posts the callback
again on any other answer.

`handle()` runs the handler for the event and returns:

- `DocumentServerCallback.ok` when the handler finished;
- `DocumentServerCallback.fail` when the handler threw or rejected, so the document server
  retries.

> [!IMPORTANT]
> After `ok`, the document server lets go of the document. Store the file before your handler
> returns.

`onError` is called with the failure before the reply is returned:

```ts
await callback.handle(handlers, {
  onError: (error, event) => logger.error({ error, key: event.key }, "callback failed"),
});
```

Handlers:

- **`save` is required.** The types refuse handlers without it: a document not stored on `2`
  is lost.
- **`forcesave` is optional**, for an integration that never forces a save. A status `6` without
  a `forcesave` handler is answered with `fail`, and `onError` gets a `CallbackError` of kind
  `"unhandled"`. The document server posts it again, so the missing handler shows up in your log
  instead of as a lost version.
- **Any other kind** without a handler is answered with `ok`.

## Invalid requests

`parse()` and `fromRequest()` reject with a `CallbackError`:

| `kind`        | Thrown when                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `"body"`      | The body is not JSON, or carries no `key`, no integer `status`, or no `url`. |
| `"token"`     | A verifier is set and the callback carries no token.                         |
| `"signature"` | The verifier refused the token. Its error is the `cause`.                    |

A fourth kind, `"unhandled"`, never comes from `parse()` or `fromRequest()`. It is what
`handle()` passes to `onError` for a `6` without a `forcesave` handler.

Such a request did not come from the document server, or not in a shape it sends. Answer it with
an error status rather than with `fail`, which would only invite it again:

```ts
try {
  callback = await DocumentServerCallback.fromRequest(request, { verifier: inbox });
} catch (error) {
  if (CallbackError.is(error)) {
    return new Response(null, { status: error.kind === "body" ? 400 : 403 });
  }

  throw error;
}
```
