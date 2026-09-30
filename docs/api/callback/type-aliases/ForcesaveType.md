[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / ForcesaveType

# Type Alias: ForcesaveType

```ts
type ForcesaveType = 0 | 1 | 2 | 3 | (number & {});
```

What started a save on status `6`:

- `0`: the `forcesave` command;
- `1`: the save button;
- `2`: the autosave timer in the document server settings;
- `3`: a submitted form, whose data is at `formsdataurl`.

## See

[forcesavetype](https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#forcesavetype)
