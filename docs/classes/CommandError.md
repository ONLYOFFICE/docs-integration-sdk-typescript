[@onlyoffice/docs-integration-sdk](../README.md) / CommandError

# Class: CommandError

The command service reported a failure in a body it answered `200 OK` with.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new CommandError(code, response): CommandError;
```

#### Parameters

| Parameter  | Type                                               |
| ---------- | -------------------------------------------------- |
| `code`     | [`CommandErrorCode`](../types/CommandErrorCode.md) |
| `response` | `Response`                                         |

#### Returns

`CommandError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type                                               | Description                                                               |
| -------------------------------- | ---------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="code"></a> `code`         | `readonly` | [`CommandErrorCode`](../types/CommandErrorCode.md) | -                                                                         |
| <a id="kind"></a> `kind`         | `readonly` | `"command"`                                        | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response`                                         | The response the error was read from. Its body has already been consumed. |

## Methods

### is()

```ts
static is(value): value is CommandError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is CommandError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
