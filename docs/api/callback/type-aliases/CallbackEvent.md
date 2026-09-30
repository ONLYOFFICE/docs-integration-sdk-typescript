[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackEvent

# Type Alias: CallbackEvent

```ts
type CallbackEvent =
  | CallbackClosed
  | CallbackEditing
  | CallbackForcesave
  | CallbackForcesaveError
  | CallbackSave
  | CallbackSaveError
  | CallbackUnknown;
```

What the document server reports, told apart by `kind`.
