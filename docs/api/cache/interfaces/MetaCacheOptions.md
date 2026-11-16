[@onlyoffice/docs-integration-sdk](../../README.md) / [cache](../README.md) / MetaCacheOptions

# Interface: MetaCacheOptions\<T\>

Settings of a [DocumentServerMetaCache](../classes/DocumentServerMetaCache.md).

## Type Parameters

| Type Parameter         |
| ---------------------- |
| `T` _extends_ `object` |

## Properties

| Property                                             | Type                | Description                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-loadtimeoutms"></a> `loadTimeoutMs?` | `number`            | How long a load may run, in whole milliseconds from `1` to `2147483647`, the longest delay timers support. Default: `60000`, a minute. A load that hasn't ended by then counts as failed: the signal passed to `getData` is aborted, a `DOMException` named `"TimeoutError"` goes to `onError`, the call waiting for the load resolves to the old data, and what the load ends with later is ignored. |
| <a id="property-onerror"></a> `onError?`             | (`error`) => `void` | Called with the error of a failed load.                                                                                                                                                                                                                                                                                                                                                               |
| <a id="property-retryms"></a> `retryMs?`             | `number`            | How long to wait after a failed load before [DocumentServerMetaCache.get](../classes/DocumentServerMetaCache.md#get) starts another, in whole milliseconds from `0`. Default: `60000`, a minute.                                                                                                                                                                                                      |
| <a id="property-ttlms"></a> `ttlMs?`                 | `number`            | How long loaded data is fresh, in whole milliseconds from `1`. Default: `86400000`, a day.                                                                                                                                                                                                                                                                                                            |

## Methods

### getData()

```ts
getData(signal): Promise<T>;
```

Loads the data, such as `(signal) => client.getConfig({ signal })` or
`async (signal) => new DocumentServerFormats(await client.getFormats({ signal }))`. Required.
Called whenever [DocumentServerMetaCache.get](../classes/DocumentServerMetaCache.md#get) finds the data stale or missing. The cache
holds what it resolves to as is and hands the same object to every call of `get()`. Resolves
to an object, never to `null`, so that `get()` resolves to `null` only while nothing has loaded.

#### Parameters

| Parameter | Type          | Description                                                                                                                                                            |
| --------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signal`  | `AbortSignal` | Aborted with a `DOMException` named `"TimeoutError"` once the load has run for `loadTimeoutMs`. Pass it on to cancel the work of a load the cache no longer waits for. |

#### Returns

`Promise`\<`T`\>
