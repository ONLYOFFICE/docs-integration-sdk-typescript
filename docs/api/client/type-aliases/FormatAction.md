[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / FormatAction

# Type Alias: FormatAction

```ts
type FormatAction =
  | "auto-convert"
  | "comment"
  | "customfilter"
  | "edit"
  | "encrypt"
  | "fill"
  | "lossy-edit"
  | "review"
  | "view"
  | (string & {});
```

Something the editors can do with a format:

- `"view"`, `"edit"`, `"comment"`, `"review"`: open it in that mode;
- `"lossy-edit"`: edit it, losing what the format can't store;
- `"fill"`: fill in a form;
- `"customfilter"`: what the `modifyFilter` permission of the editor config needs;
- `"auto-convert"`: convert it on open, like the legacy `doc`;
- `"encrypt"`: open it behind a password.

A newer document server may name an action this SDK doesn't know.
