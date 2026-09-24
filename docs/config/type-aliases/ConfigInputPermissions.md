[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigInputPermissions

# Type Alias: ConfigInputPermissions

```ts
type ConfigInputPermissions = Omit<ConfigPermissions, "edit"> & {
  edit: boolean;
};
```

What your system grants on the file. `edit` is required: whether the file may be
changed is a decision of your system, not a default of the editor.

## Type Declaration

| Name   | Type      |
| ------ | --------- |
| `edit` | `boolean` |
