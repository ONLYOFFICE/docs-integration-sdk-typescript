# Commands

`command()` calls `/command`, the [command service][command-service]. It manages documents that
are open in the editors, and the files they left behind. The `c` field picks the command:

```ts
const result = await client.command({ c: "info", key: "Khirz6zTPdfd7" });

result.users; // ["6d5a81d0", "78e1e841"]
```

| Command            | Parameters          | Answers                      | Does                                        |
| ------------------ | ------------------- | ---------------------------- | ------------------------------------------- |
| `deleteForgotten`  | `key`               | `key`                        | Removes a forgotten document.               |
| `drop`             | `key`, `users`      | `key`                        | Disconnects users from co-editing.          |
| `forcesave`        | `key`, `userdata`   | `key`                        | Saves the document without closing it.      |
| `getForgotten`     | `key`               | `key`, `url`                 | Returns the URL of a forgotten document.    |
| `getForgottenList` | —                   | `keys`                       | Lists the forgotten documents.              |
| `info`             | `key`, `userdata`   | `key`, `users`               | Returns who has the document open.          |
| `license`          | —                   | `license`, `quota`, `server` | Returns the license and the quota used.     |
| `meta`             | `key`, `meta.title` | `key`                        | Renames the document in every editor.       |
| `version`          | —                   | `version`                    | Returns the version of the document server. |

## Typed parameters

`CommandRequest` is a union discriminated on `c`, so each command is checked against its own
parameters. `{ c: "version", key }` doesn't compile, and neither does `{ c: "meta", key }`
without `meta`:

```ts
await client.command({ c: "meta", key, meta: { title: "Contract.docx" } });
await client.command({ c: "drop", key, users: ["6d5a81d0"] });
await client.command({ c: "forcesave", key, userdata: "before-download" });
```

`drop` without `users` disconnects everyone. Versions before Docs 8.3 require the list.

## Response and errors

The response is one `CommandResponse` type, because the body doesn't say which command it
answers. Only `error` is always present, `0` on success. The rest depends on the command.

A non-zero `error` rejects with a `CommandError`. The codes, `0` to `6`, are listed on
`CommandErrorCode`.

**`4` is the exception.** It means nothing changed since the last save. For `forcesave` that is
an outcome, not a failure, so it is returned on the result instead of thrown:

```ts
const result = await client.command({ c: "forcesave", key });

if (result.error === 4) {
  // The document had no unsaved changes.
}
```

> [!NOTE]
> `forcesave` with `error: 0` only means the save has started. The file arrives at your
> [callback handler](callback.md), with `forcesavetype` and the `userdata` you passed.

## Signing

Send the token as for a conversion: in the body as `token`, or in a header as the second
argument. See [Body token and header token](jwt.md#body-token-and-header-token).

```ts
await client.command({ ...request, token: await jwt.sign(request) });
await client.command(request, await jwt.signHeader(request));
```

The `shardkey` query parameter is added for commands with a `key`. It is left out for
`getForgottenList`, `license` and `version`, which are about the server, not a document.

[command-service]: https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/
