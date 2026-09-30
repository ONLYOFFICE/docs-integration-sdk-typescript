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

What [DocumentServerClient.convertFromFile](../classes/DocumentServerClient.md#convertfromfile) returns: the converted file, or, while an
`async` conversion runs, its progress. Check `endConvert` to tell them apart.

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
