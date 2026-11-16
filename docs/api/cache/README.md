[@onlyoffice/docs-integration-sdk](../README.md) / cache

# cache

Keeps the configuration and the formats of a document server in memory. Imported from
`@onlyoffice/docs-integration-sdk/cache`.

## See

[Caching the server configuration](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/cache.md)

## Classes

| Class                                                         | Description                                                                                                                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DocumentServerMetaCache](classes/DocumentServerMetaCache.md) | Keeps one answer of a document server in memory, such as `/meta/config` or `/meta/formats`, so that a request to your application doesn't cost one to the document server. Create one cache per answer. |

## Interfaces

| Interface                                          | Description                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| [MetaCacheOptions](interfaces/MetaCacheOptions.md) | Settings of a [DocumentServerMetaCache](classes/DocumentServerMetaCache.md). |
