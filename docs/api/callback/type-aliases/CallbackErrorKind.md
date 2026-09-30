[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackErrorKind

# Type Alias: CallbackErrorKind

```ts
type CallbackErrorKind = "body" | "signature" | "token" | "unhandled";
```

Why a callback was refused, the discriminant of [CallbackError](../classes/CallbackError.md):

- `"body"`: the body is not a callback the document server sends;
- `"token"`: a verifier is set and the callback carries no token;
- `"signature"`: the verifier rejected the token;
- `"unhandled"`: a `forcesave` event has no handler. Only passed to `onError` of
  [DocumentServerCallback.handle](../classes/DocumentServerCallback.md#handle), never thrown.
