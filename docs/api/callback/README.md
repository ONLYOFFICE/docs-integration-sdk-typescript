[@onlyoffice/docs-integration-sdk](../README.md) / callback

# callback

What the document server posts to the callback URL, checked against its token and told
apart by what it reports. Imported from `@onlyoffice/docs-integration-sdk/callback`.

## Classes

| Class                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CallbackError](classes/CallbackError.md)                   | Thrown by [DocumentServerCallback.parse](classes/DocumentServerCallback.md#parse), [DocumentServerCallback.fromRequest](classes/DocumentServerCallback.md#fromrequest) and the [DocumentServerCallback](classes/DocumentServerCallback.md) constructor when a request is not a valid callback. Such a request did not come from the document server: reply with an error status, `400` or `403`, not with `fail`, which invites it again. |
| [DocumentServerCallback](classes/DocumentServerCallback.md) | A callback the document server posted to `callbackUrl`, checked against its token.                                                                                                                                                                                                                                                                                                                                                        |

## Interfaces

| Interface                                                      | Description                                                                                                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CallbackAction](interfaces/CallbackAction.md)                 | Something a user did to the document.                                                                                                                                         |
| [CallbackBody](interfaces/CallbackBody.md)                     | Body of a request the document server posts to the callback URL.                                                                                                              |
| [CallbackClosed](interfaces/CallbackClosed.md)                 | Status `4`: the last editor closed and nothing changed.                                                                                                                       |
| [CallbackEditing](interfaces/CallbackEditing.md)               | Status `1`: a user connected or disconnected. `actions` says which.                                                                                                           |
| [CallbackForcesave](interfaces/CallbackForcesave.md)           | Status `6`: the document was saved while it is edited. Download `url` and store a version.                                                                                    |
| [CallbackForcesaveError](interfaces/CallbackForcesaveError.md) | Status `7`: the save on status `6` failed.                                                                                                                                    |
| [CallbackHandlers](interfaces/CallbackHandlers.md)             | The handlers [DocumentServerCallback.handle](classes/DocumentServerCallback.md#handle) runs, one for each event kind. A handler may return a promise; the reply waits for it. |
| [CallbackHistory](interfaces/CallbackHistory.md)               | The changes of the saved document, in the shape the editor's `refreshHistory` takes.                                                                                          |
| [CallbackInput](interfaces/CallbackInput.md)                   | A callback request taken apart, for a framework that parses the body itself.                                                                                                  |
| [CallbackOptions](interfaces/CallbackOptions.md)               | How [DocumentServerCallback.parse](classes/DocumentServerCallback.md#parse) checks a callback.                                                                                |
| [CallbackReply](interfaces/CallbackReply.md)                   | The reply to a callback: `0` handled, `1` to be posted again.                                                                                                                 |
| [CallbackSave](interfaces/CallbackSave.md)                     | Status `2`: the last editor closed and the document changed. Download `url` and store it.                                                                                     |
| [CallbackSaveError](interfaces/CallbackSaveError.md)           | Status `3`: the document server failed to build the document. `url` may be missing.                                                                                           |
| [CallbackUnknown](interfaces/CallbackUnknown.md)               | A status this SDK doesn't know yet. Read `status`.                                                                                                                            |
| [CallbackVerifier](interfaces/CallbackVerifier.md)             | Checks the token of a callback. [DocumentServerJwt](../jwt/classes/DocumentServerJwt.md) implements it; any object with `verify()` works.                                     |
| [HandleOptions](interfaces/HandleOptions.md)                   | Options of [DocumentServerCallback.handle](classes/DocumentServerCallback.md#handle).                                                                                         |

## Type Aliases

| Type Alias                                               | Description                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [CallbackActionType](type-aliases/CallbackActionType.md) | What a user did: `0` disconnected, `1` connected, `2` requested a save.                                                                                            |
| [CallbackErrorKind](type-aliases/CallbackErrorKind.md)   | Why a callback was refused, the discriminant of [CallbackError](classes/CallbackError.md):                                                                         |
| [CallbackEvent](type-aliases/CallbackEvent.md)           | What the document server reports. A `switch` over `kind` narrows it.                                                                                               |
| [CallbackEventKind](type-aliases/CallbackEventKind.md)   | The kind of an event, the discriminant of [CallbackEvent](type-aliases/CallbackEvent.md).                                                                          |
| [CallbackHeaders](type-aliases/CallbackHeaders.md)       | The headers of a request: fetch `Headers` or a plain Node headers object. Names are matched in any case; of a header given several times, the first value is read. |
| [CallbackStatus](type-aliases/CallbackStatus.md)         | What happened to the document:                                                                                                                                     |
| [ForcesaveType](type-aliases/ForcesaveType.md)           | What started a save on status `6`:                                                                                                                                 |
