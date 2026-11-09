[@onlyoffice/docs-integration-sdk](../../README.md) / [cache](../README.md) / DocumentServerMetaCache

# Class: DocumentServerMetaCache\<T\>

Keeps one answer of a document server in memory, such as `/meta/config` or `/meta/formats`,
so that a request to your application doesn't cost one to the document server. Create one
cache per answer.

A call to [DocumentServerMetaCache.get](#get) that finds the data stale or missing starts a
load and waits for it; calls made while a load runs don't wait and get what is cached, or
`null` before the first load succeeds. A failed load keeps the old data and is not retried for
`retryMs`; a load still running after `loadTimeoutMs` is aborted and counts as failed.

The cache sends no requests of its own: loads start only from `get()`.

## Example

```ts
const formats = new DocumentServerMetaCache({
  getData: async (signal) => new DocumentServerFormats(await client.getFormats({ signal })),
});

(await formats.get())?.isEditable("docx");
```

## See

[Caching the server configuration](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/cache.md)

## Type Parameters

| Type Parameter         |
| ---------------------- |
| `T` _extends_ `object` |

## Constructors

### Constructor

```ts
new DocumentServerMetaCache<T>(options): DocumentServerMetaCache<T>;
```

#### Parameters

| Parameter | Type                                                           | Description                                         |
| --------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `options` | [`MetaCacheOptions`](../interfaces/MetaCacheOptions.md)\<`T`\> | Where the data comes from, and how long it is kept. |

#### Returns

`DocumentServerMetaCache`\<`T`\>

#### Throws

when `ttlMs`, `retryMs` or `loadTimeoutMs` is out of its range.

## Methods

### get()

```ts
get(): Promise<T | null>;
```

Resolves to the cached data, or `null` while nothing has loaded yet. When the data is stale
or missing, no load runs and the last one didn't fail less than `retryMs` ago, starts a
load and resolves once it ends: to the new data, or, when the load fails, to the old.
Otherwise resolves at once. Never rejects.

#### Returns

`Promise`\<`T` \| `null`\>
