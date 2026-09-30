[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / CommandError

# Class: CommandError

The command service answered `200 OK` with an error code. Thrown by [DocumentServerClient.command](DocumentServerClient.md#command) for any code but `0` and `4`.
The message names the code and what it means.

## Extends

- [`DocumentServerError`](DocumentServerError.md)

## Constructors

### Constructor

```ts
new CommandError(code, response): CommandError;
```

#### Parameters

| Parameter  | Type                                                      |
| ---------- | --------------------------------------------------------- |
| `code`     | [`CommandErrorCode`](../type-aliases/CommandErrorCode.md) |
| `response` | `Response`                                                |

#### Returns

`CommandError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`constructor`](DocumentServerError.md#constructor)

## Properties

| Property                                  | Modifier   | Type                                                      | Description                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-code"></a> `code`         | `readonly` | [`CommandErrorCode`](../type-aliases/CommandErrorCode.md) | The error code, one of [CommandErrorCode](../type-aliases/CommandErrorCode.md). A code the service doesn't document stays a plain number, so keep a `default` branch in a `switch` over it.                                                           |
| <a id="property-kind"></a> `kind`         | `readonly` | `"command"`                                               | Which failure the error stands for.                                                                                                                                                                                                                   |
| <a id="property-response"></a> `response` | `readonly` | `Response`                                                | The response the error was read from, with its body already read. `undefined` for a network error and a timeout, which can happen before any response.                                                                                                |
| <a id="property-url"></a> `url`           | `readonly` | `string`                                                  | The URL of the request, without the query, since a download URL carries its signature there. Taken from the response when there is one, so it is where a redirect ended. Empty when unknown, such as for a `Response` your own `fetch` built by hand. |

## Methods

### is()

```ts
static is(value): value is CommandError;
```

Returns whether `value` is a `CommandError`, also one thrown by a second copy of the package.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is CommandError`

#### Overrides

[`DocumentServerError`](DocumentServerError.md).[`is`](DocumentServerError.md#is)
