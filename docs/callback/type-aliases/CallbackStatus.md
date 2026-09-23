[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackStatus

# Type Alias: CallbackStatus

```ts
type CallbackStatus = 1 | 2 | 3 | 4 | 6 | 7 | (number & {});
```

What the document server reports of a document: `1` being edited, `2` ready to be saved,
`3` failed to be saved, `4` closed with no changes, `6` saved while being edited, `7`
failed to be saved while being edited.
