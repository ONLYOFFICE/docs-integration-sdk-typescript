[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConvertFileResult

# Type Alias: ConvertFileResult

```ts
type ConvertFileResult =
  | {
      endConvert: false;
      percent: number;
    }
  | {
      endConvert: true;
      file: Response;
    };
```

What a conversion of a document sent along with the request answers: the converted file,
or, while an `async` one is still running, how far it has got.

## Union Members

### Type Literal

```ts
{
  endConvert: false;
  percent: number;
}
```

| Name         | Type     | Description                             |
| ------------ | -------- | --------------------------------------- |
| `endConvert` | `false`  | -                                       |
| `percent`    | `number` | Progress of the conversion, in percent. |

---

### Type Literal

```ts
{
  endConvert: true;
  file: Response;
}
```

| Name         | Type       | Description                                                 |
| ------------ | ---------- | ----------------------------------------------------------- |
| `endConvert` | `true`     | -                                                           |
| `file`       | `Response` | The converted file, unread, so a large one can be streamed. |
