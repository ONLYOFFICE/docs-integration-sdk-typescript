[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / DocumentServerCallback

# Class: DocumentServerCallback

A callback the document server posted to `callbackUrl`, checked against its token.

[DocumentServerCallback.fromRequest](#fromrequest) or [DocumentServerCallback.parse](#parse) checks
the request, [DocumentServerCallback.event](#property-event) says what happened, and
[DocumentServerCallback.handle](#handle) runs your handler and builds the reply.

The document server expects the reply `{"error":0}`; on any other reply, the document editor
shows an error message.

## Example

```ts
export async function POST(request: Request): Promise<Response> {
  const callback = await DocumentServerCallback.fromRequest(request, { verifier: jwt });

  const reply = await callback.handle({
    save: async ({ url }) => {
      const { path, query } = splitFileUrl(url, publicUrl);
      await storage.saveNewVersion(fileId, (await client.getFile(path, query)).body);
    },
  });

  return Response.json(reply);
}
```

## See

[Handling callbacks](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/callback.md)

## Constructors

### Constructor

```ts
new DocumentServerCallback(body): DocumentServerCallback;
```

Reads a callback body you already trust, without checking a token. To check the token,
use [DocumentServerCallback.parse](#parse) or [DocumentServerCallback.fromRequest](#fromrequest).

#### Parameters

| Parameter | Type      | Description                |
| --------- | --------- | -------------------------- |
| `body`    | `unknown` | The callback body, parsed. |

#### Returns

`DocumentServerCallback`

#### Throws

[CallbackError](CallbackError.md) of kind `"body"` when the body is not an object, `key` is
not a non-empty string, `status` is not an integer, or `url` is not a string on status `2`
or `6`.

## Properties

| Property                            | Modifier   | Type                                                | Default value | Description                                                              |
| ----------------------------------- | ---------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| <a id="property-event"></a> `event` | `readonly` | [`CallbackEvent`](../type-aliases/CallbackEvent.md) | `undefined`   | What the document server reports: the callback body plus `kind`, frozen. |
| <a id="property-fail"></a> `fail`   | `readonly` | [`CallbackReply`](../interfaces/CallbackReply.md)   | `FAIL`        | The reply `{ error: 1 }`: the callback is not handled.                   |
| <a id="property-ok"></a> `ok`       | `readonly` | [`CallbackReply`](../interfaces/CallbackReply.md)   | `OK`          | The reply `{ error: 0 }`: the callback is handled.                       |

## Methods

### fromRequest()

```ts
static fromRequest(request, options): Promise<DocumentServerCallback>;
```

Reads the body of a fetch `Request`, as Next.js, Hono, Deno and edge runtimes give it, and
checks it like [DocumentServerCallback.parse](#parse).

#### Parameters

| Parameter | Type                                                  | Description                                            |
| --------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `request` | `Request`                                             | The request posted to `callbackUrl`. Its body is read. |
| `options` | [`CallbackOptions`](../interfaces/CallbackOptions.md) | The verifier, and the header the token is read from.   |

#### Returns

`Promise`\<`DocumentServerCallback`\>

The callback, with the event it reports.

#### Throws

[CallbackError](CallbackError.md) whenever [DocumentServerCallback.parse](#parse) would.

---

### handle()

```ts
handle(handlers, options?): Promise<CallbackReply>;
```

Runs the handler for [DocumentServerCallback.event](#property-event) and returns the reply to send:

- [DocumentServerCallback.ok](#property-ok) when the handler finished, or when the kind has no
  handler, except `forcesave`;
- [DocumentServerCallback.fail](#property-fail) when the handler threw or rejected, or when a
  `forcesave` event has no handler. `onError` is called first; for a missing `forcesave`
  handler it gets a [CallbackError](CallbackError.md) of kind `"unhandled"`.

Never rejects: every failure becomes the reply `fail`.

#### Parameters

| Parameter  | Type                                                    | Description                                                |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `handlers` | [`CallbackHandlers`](../interfaces/CallbackHandlers.md) | The handlers, one for each event kind. `save` is required. |
| `options?` | [`HandleOptions`](../interfaces/HandleOptions.md)       | `onError`, to log a failure.                               |

#### Returns

`Promise`\<[`CallbackReply`](../interfaces/CallbackReply.md)\>

The reply, to send back as the JSON body of the response.

---

### parse()

```ts
static parse(input, options): Promise<DocumentServerCallback>;
```

Checks the token of a callback and reads its body. For a framework that parses the body
itself, such as Express with `express.json()`.

Where the token is looked for:

1. `token` in the body, when it is a string. It signs the callback itself.
2. Otherwise the header named by `authorizationHeader`, after `authorizationPrefix`. It
   signs the callback as `{ payload: … }`.

Once the token is checked, the callback is what the token carries, and the unsigned body
is ignored.

#### Parameters

| Parameter | Type                                                  | Description                                          |
| --------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `input`   | [`CallbackInput`](../interfaces/CallbackInput.md)     | The body and the headers of the request.             |
| `options` | [`CallbackOptions`](../interfaces/CallbackOptions.md) | The verifier, and the header the token is read from. |

#### Returns

`Promise`\<`DocumentServerCallback`\>

The callback, with the event it reports.

#### Throws

[CallbackError](CallbackError.md) of kind:

- `"body"` when the body is a string or bytes that are not JSON, when a header token
  carries no `payload` object, or when the callback fails the checks of the
  constructor;
- `"token"` when `verifier` is set and there is no token: no string `token` in the body,
  and the header is missing, has another prefix or holds only the prefix;
- `"signature"` when the verifier rejects the token. Its error is the `cause`.
