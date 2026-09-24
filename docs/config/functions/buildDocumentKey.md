[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / buildDocumentKey

# Function: buildDocumentKey()

```ts
function buildDocumentKey(...parts): string;
```

Builds a document key out of the parts that identify a revision of a file, such as its
identifier in your storage and the moment it was last written.

The parts are joined with `_`, and every run of characters the document server does not
accept in a key becomes a `-`. That loses what those characters were — `Отчёт.docx` and
`Счёт.docx` would both come out `.docx` — so a key that had any replaced is given a
fingerprint of the parts as they were given, which keeps two such files apart. A key
that would come out longer than the 128 characters the server allows is cut to fit and
given a fingerprint too, so two long keys that differ only in their tail stay apart.

The key stands for one revision, not for one file: a document the editors saved is a
new revision and takes a new key, or the server hands back the one it has cached.

## Parameters

| Parameter  | Type                              |
| ---------- | --------------------------------- |
| ...`parts` | readonly (`string` \| `number`)[] |

## Returns

`string`

## Throws

when no part is given, or the parts are all empty.
