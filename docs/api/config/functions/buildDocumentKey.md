[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / buildDocumentKey

# Function: buildDocumentKey()

```ts
function buildDocumentKey(...parts): Promise<string>;
```

Builds a document key from the parts that identify one revision of a file, such as the
instance of your system, the file ID and the version.

The key is the SHA-256 of the parts in base64url: 43 characters the document server
accepts, however long the parts are. Different parts always give different keys, including
`("a_b", "c")` and `("a", "b_c")`. The same parts always give the same key. A number and its
string form count as the same part.

A key stands for one revision, not for the file: the document server serves a document from
its cache when it sees a key it knows. So one part must change with every write of the file,
such as a version counter, an etag or a content hash.

## Parameters

| Parameter  | Type                              | Description                           |
| ---------- | --------------------------------- | ------------------------------------- |
| ...`parts` | readonly (`string` \| `number`)[] | The parts, strings or finite numbers. |

## Returns

`Promise`\<`string`\>

The key, 43 characters of base64url.

## Example

```ts
const key = await buildDocumentKey(instanceId, file.id, file.version);
```

## Throws

when no part is given, every part is empty, or a part is neither a
string nor a finite number, such as `undefined` or `NaN`.

## See

[Document keys](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/editor.md#document-keys)
