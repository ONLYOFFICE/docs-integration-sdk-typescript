[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackStatus

# Type Alias: CallbackStatus

```ts
type CallbackStatus = 1 | 2 | 3 | 4 | 6 | 7 | (number & {});
```

What happened to the document:

- `1`: a user connected or disconnected;
- `2`: the last editor closed and the document changed;
- `3`: the document server failed to build the document;
- `4`: the last editor closed and nothing changed;
- `6`: the document was saved while it is edited;
- `7`: that save failed.

Any other number is a status this SDK doesn't know yet.
