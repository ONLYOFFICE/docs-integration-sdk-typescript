[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackError

# Class: CallbackError

Thrown by [DocumentServerCallback.parse](DocumentServerCallback.md#parse), [DocumentServerCallback.fromRequest](DocumentServerCallback.md#fromrequest)
and the [DocumentServerCallback](DocumentServerCallback.md) constructor when a request is not a valid callback.
Such a request did not come from the document server: reply with an error status, `400` or
`403`, not with `fail`, which invites it again.

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
