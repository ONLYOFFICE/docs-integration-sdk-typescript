[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackError

# Class: CallbackError

Thrown by [DocumentServerCallback.parse](DocumentServerCallback.md#parse), [DocumentServerCallback.fromRequest](DocumentServerCallback.md#fromrequest)
and the [DocumentServerCallback](DocumentServerCallback.md) constructor when a request is not a valid callback.
Such a request did not come from the document server: reply with `400` or `403`, not with
`fail`.

[DocumentServerCallback.handle](DocumentServerCallback.md#handle) passes one of kind `"unhandled"` to `onError`.

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

Creates the error, for a check of your own that refuses a callback the same way.

#### Parameters

| Parameter  | Type                                                        | Description                                                |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `kind`     | [`CallbackErrorKind`](../type-aliases/CallbackErrorKind.md) | Which check refused the callback.                          |
| `message`  | `string`                                                    | What was wrong, for a log.                                 |
| `options?` | `ErrorOptions`                                              | The `cause`: for `"signature"`, the error of the verifier. |

#### Returns

`CallbackError`

#### Overrides

```ts
Error.constructor;
```

## Properties

| Property                          | Modifier   | Type                                                        | Description                                                                               |
| --------------------------------- | ---------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| <a id="property-kind"></a> `kind` | `readonly` | [`CallbackErrorKind`](../type-aliases/CallbackErrorKind.md) | Which check refused the callback. For `"signature"`, the verifier's error is the `cause`. |

## Methods

### is()

```ts
static is(value): value is CallbackError;
```

Returns whether `value` is a `CallbackError`, also one thrown by a second copy of the
package, which `instanceof` misses.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is CallbackError`
