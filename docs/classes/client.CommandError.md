[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / CommandError

# Class: CommandError

The command service reported a failure in a body it answered `200 OK` with.

## Extends

- [`DocumentServerError`](client.DocumentServerError.md)

## Constructors

### Constructor

```ts
new CommandError(code, response): CommandError;
```

#### Parameters

| Parameter  | Type                                                      |
| ---------- | --------------------------------------------------------- |
| `code`     | [`CommandErrorCode`](../types/client.CommandErrorCode.md) |
| `response` | `Response`                                                |

#### Returns

`CommandError`

#### Overrides

[`DocumentServerError`](client.DocumentServerError.md).[`constructor`](client.DocumentServerError.md#constructor)

## Properties

| Property                         | Modifier   | Type                                                      | Description                                                               |
| -------------------------------- | ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="code"></a> `code`         | `readonly` | [`CommandErrorCode`](../types/client.CommandErrorCode.md) | -                                                                         |
| <a id="kind"></a> `kind`         | `readonly` | `"command"`                                               | -                                                                         |
| <a id="response"></a> `response` | `readonly` | `Response`                                                | The response the error was read from. Its body has already been consumed. |

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

[`DocumentServerError`](client.DocumentServerError.md).[`is`](client.DocumentServerError.md#is)
