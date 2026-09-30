[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackError

# Class: CallbackError

A callback that could not be taken: a body that is not one, a token missing where one is
required, or a token the verifier refused, which is then the `cause`. Or, as
[DocumentServerCallback.handle](DocumentServerCallback.md#handle) tells `onError`, a document saved on `6` with no
handler to store it.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new CallbackError(
   kind,
   message,
   options?
): CallbackError;
```

#### Parameters

| Parameter  | Type                                                        |
| ---------- | ----------------------------------------------------------- |
| `kind`     | [`CallbackErrorKind`](../type-aliases/CallbackErrorKind.md) |
| `message`  | `string`                                                    |
| `options?` | `ErrorOptions`                                              |

#### Returns

`CallbackError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                          | Modifier   | Type                                                        | Description                               |
| --------------------------------- | ---------- | ----------------------------------------------------------- | ----------------------------------------- |
| <a id="property-kind"></a> `kind` | `readonly` | [`CallbackErrorKind`](../type-aliases/CallbackErrorKind.md) | Which of the checks refused the callback. |

## Methods

### is()

```ts
static is(value): value is CallbackError;
```

Recognizes an error of this SDK, a second copy of the package included.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is CallbackError`
