[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / buildDocumentKey

# Function: buildDocumentKey()

```ts
function buildDocumentKey(...parts): Promise<string>;
```

Builds a document key out of the parts that identify a revision of a file, such as the
instance of your system, the identifier of the file in your storage and its version.

The key is the SHA-256 of the parts, in base64url: 43 characters the document server
accepts, whatever the parts are made of and however long they are. Two lists of parts
that differ in any way — `["a_b", "c"]` and `["a", "b_c"]` included — never come out the
same key, and the same parts always do. A number and the string it is written as count
as the same part.

The key stands for one revision, not for one file: a document the editors saved is a new
revision and takes a new key, or the server hands back the one it has cached. So one of
the parts has to change with every write — a version counter, an etag, a hash of the
content — and the key tells nothing of the file it was built from.

## Parameters

| Parameter  | Type                              |
| ---------- | --------------------------------- |
| ...`parts` | readonly (`string` \| `number`)[] |

## Returns

`Promise`\<`string`\>

## Throws

when no part is given, every part is empty, or a part is neither a
string nor a finite number.
