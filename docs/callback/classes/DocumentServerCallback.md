[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / DocumentServerCallback

# Class: DocumentServerCallback

A request the document server posted to the callback URL: checked against its token,
and told apart by what it reports.

The document server takes `{"error":0}` for an answer that the callback is dealt with,
and posts it again on anything else. A document saved on `2` or `6` is to be stored
before the answer, then, and [DocumentServerCallback.handle](#handle) answers so.

## Constructors

### Constructor

```ts
new DocumentServerCallback(body): DocumentServerCallback;
```

A callback out of a body already trusted. The body is not checked against a token:
[DocumentServerCallback.parse](#parse) is what does that.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `body`    | `unknown` |

#### Returns

`DocumentServerCallback`

#### Throws

[CallbackError](CallbackError.md) when the body is not an object, or carries no key, an
integer status, or the url a save comes with.

## Properties

| Property                            | Modifier   | Type                                                | Default value | Description                                         |
| ----------------------------------- | ---------- | --------------------------------------------------- | ------------- | --------------------------------------------------- |
| <a id="property-event"></a> `event` | `readonly` | [`CallbackEvent`](../type-aliases/CallbackEvent.md) | `undefined`   | What the document server reports, frozen.           |
| <a id="property-fail"></a> `fail`   | `readonly` | [`CallbackReply`](../interfaces/CallbackReply.md)   | `FAIL`        | The answer that the callback is to be posted again. |
| <a id="property-ok"></a> `ok`       | `readonly` | [`CallbackReply`](../interfaces/CallbackReply.md)   | `OK`          | The answer that the callback is dealt with.         |

## Methods

### fromRequest()

```ts
static fromRequest(request, options): Promise<DocumentServerCallback>;
```

[DocumentServerCallback.parse](#parse) over a `Request` of fetch, as Next.js, Hono, Deno
and the edge runtimes hand it over. The body is read.

#### Parameters

| Parameter | Type                                                  |
| --------- | ----------------------------------------------------- |
| `request` | `Request`                                             |
| `options` | [`CallbackOptions`](../interfaces/CallbackOptions.md) |

#### Returns

`Promise`\<`DocumentServerCallback`\>

---

### handle()

```ts
handle(handlers, options?): Promise<CallbackReply>;
```

Runs the handler of the event and answers the way the document server expects:
[DocumentServerCallback.ok](#property-ok) once the handler is done, and
[DocumentServerCallback.fail](#property-fail) when it failed, so the document server posts the
callback again.

A kind with no handler is answered with `ok`. `save` has to have one, since a document
left unstored on it is lost.

#### Parameters

| Parameter  | Type                                                    |
| ---------- | ------------------------------------------------------- |
| `handlers` | [`CallbackHandlers`](../interfaces/CallbackHandlers.md) |
| `options?` | [`HandleOptions`](../interfaces/HandleOptions.md)       |

#### Returns

`Promise`\<[`CallbackReply`](../interfaces/CallbackReply.md)\>

---

### parse()

```ts
static parse(input, options): Promise<DocumentServerCallback>;
```

Checks a callback against its token and reads what it reports.

A token in the body is checked first, one in the header if the body carries none. Once
the token is checked, what it carries is the callback, and the unsigned body is left
aside: in the body the token signs the callback itself, in the header it signs it as
`{ payload: … }`.

#### Parameters

| Parameter | Type                                                  |
| --------- | ----------------------------------------------------- |
| `input`   | [`CallbackInput`](../interfaces/CallbackInput.md)     |
| `options` | [`CallbackOptions`](../interfaces/CallbackOptions.md) |

#### Returns

`Promise`\<`DocumentServerCallback`\>

#### Throws

[CallbackError](CallbackError.md) when the body is not a callback, no token is found and a
verifier requires one, or the verifier refuses it.
