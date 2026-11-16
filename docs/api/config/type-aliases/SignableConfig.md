[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / SignableConfig

# Type Alias: SignableConfig

```ts
type SignableConfig = Omit<Config, "events">;
```

A config without `events`: what is serialized and signed. Events are functions, so they
don't survive `JSON.stringify` and can't be signed. Add them in the browser, where the editor
is created.

## See

[events](https://api.onlyoffice.com/docs/docs-api/usage-api/config/events/)
