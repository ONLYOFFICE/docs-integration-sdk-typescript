[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigInputPermissions

# Type Alias: ConfigInputPermissions

```ts
type ConfigInputPermissions = Omit<ConfigPermissions, "edit"> & {
  edit: boolean;
};
```

The permissions your system grants on the file. `edit` is required: the SDK has no default
for whether a file may be changed.

## Type Declaration

| Name   | Type      |
| ------ | --------- |
| `edit` | `boolean` |
