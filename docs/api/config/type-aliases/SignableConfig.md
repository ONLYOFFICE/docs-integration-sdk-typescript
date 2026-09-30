[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / SignableConfig

# Type Alias: SignableConfig

```ts
type SignableConfig = Omit<Config, "events">;
```

A config without the `events` section, which is what is serialized and signed.

The events are functions the browser calls, so they neither survive `JSON.stringify`
nor belong in a token. They are attached to the config in the browser, where the editor
is constructed, rather than here.
