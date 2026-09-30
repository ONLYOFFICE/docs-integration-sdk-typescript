[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / CommandRequest

# Type Alias: CommandRequest

```ts
type CommandRequest =
  | DeleteForgottenCommand
  | DropCommand
  | ForcesaveCommand
  | GetForgottenCommand
  | GetForgottenListCommand
  | InfoCommand
  | LicenseCommand
  | MetaCommand
  | VersionCommand;
```

The body of a request to `/command`, the command service: one of the commands, told apart by
`c`. Each command is checked against its own parameters.

## See

[Command service](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/)
