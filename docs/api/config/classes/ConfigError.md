[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigError

# Class: ConfigError

Thrown by the [DocumentServerConfig](DocumentServerConfig.md) constructor when the config can't be built. The
constructor lists every check.

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

Creates the error, for a check of your own that refuses a config the same way.

#### Parameters

| Parameter  | Type                                                    | Description                                                |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `kind`     | [`ConfigErrorKind`](../type-aliases/ConfigErrorKind.md) | Which check refused the config.                            |
| `field`    | `string`                                                | The path of the refused field, such as `"document.title"`. |
| `message`  | `string`                                                | What was wrong, for a log.                                 |
| `options?` | `ErrorOptions`                                          | The `cause`, such as the error the check failed with.      |

#### Returns

`ConfigError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                            | Modifier   | Type                                                    | Description                                                                                   |
| ----------------------------------- | ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| <a id="property-field"></a> `field` | `readonly` | `string`                                                | The path of the refused field, such as `"document.title"`, or `"config"` for the whole input. |
| <a id="property-kind"></a> `kind`   | `readonly` | [`ConfigErrorKind`](../type-aliases/ConfigErrorKind.md) | Which check refused the config.                                                               |

## Methods

### is()

```ts
static is(value): value is ConfigError;
```

Returns whether `value` is a `ConfigError`, also one thrown by a second copy of the
package, which `instanceof` misses.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is ConfigError`
