[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigErrorKind

# Type Alias: ConfigErrorKind

```ts
type ConfigErrorKind = "invalid" | "unsupported";
```

Why a config was refused, the discriminant of [ConfigError](../classes/ConfigError.md):

- `"unsupported"`: no editor of the document server opens the format of the file;
- `"invalid"`: a field is missing, or has a value the document server would reject.
