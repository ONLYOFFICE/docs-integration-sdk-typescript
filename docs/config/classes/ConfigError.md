[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigError

# Class: ConfigError

A config that could not be built: a field the document server would reject (`invalid`),
or a file whose format no editor of the server opens (`unsupported`).

## Extends

- `Error`

## Constructors

### Constructor

```ts
new ConfigError(
   kind,
   field,
   message,
   options?
): ConfigError;
```

#### Parameters

| Parameter  | Type                                                    |
| ---------- | ------------------------------------------------------- |
| `kind`     | [`ConfigErrorKind`](../type-aliases/ConfigErrorKind.md) |
| `field`    | `string`                                                |
| `message`  | `string`                                                |
| `options?` | `ErrorOptions`                                          |

#### Returns

`ConfigError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                            | Modifier   | Type                                                    | Description                                            |
| ----------------------------------- | ---------- | ------------------------------------------------------- | ------------------------------------------------------ |
| <a id="property-field"></a> `field` | `readonly` | `string`                                                | Path of the field refused, such as `"document.title"`. |
| <a id="property-kind"></a> `kind`   | `readonly` | [`ConfigErrorKind`](../type-aliases/ConfigErrorKind.md) | Which of the checks refused the config.                |

## Methods

### is()

```ts
static is(value): value is ConfigError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is ConfigError`
