[@onlyoffice/docs-integration-sdk](../README.md) / callback

# callback

What the document server posts to the callback URL, checked against its token and told
apart by what it reports. Imported from `@onlyoffice/docs-integration-sdk/callback`.

## Classes

| Class                                                       | Description                                                                                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CallbackError](classes/CallbackError.md)                   | A callback that could not be taken: a body that is not one, a token missing where one is required, or a token the verifier refused, which is then the `cause`. |
| [DocumentServerCallback](classes/DocumentServerCallback.md) | A request the document server posted to the callback URL: checked against its token, and told apart by what it reports.                                        |

## Interfaces

| Interface                                                      | Description                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [CallbackAction](interfaces/CallbackAction.md)                 | Something a user did to the document.                                                                                    |
| [CallbackBody](interfaces/CallbackBody.md)                     | Body of a request the document server posts to the callback URL.                                                         |
| [CallbackClosed](interfaces/CallbackClosed.md)                 | Every editor is closed and nothing changed.                                                                              |
| [CallbackEditing](interfaces/CallbackEditing.md)               | The document is being edited: a user connected or disconnected.                                                          |
| [CallbackForcesave](interfaces/CallbackForcesave.md)           | The document was saved while being edited: download it from `url` and store it.                                          |
| [CallbackForcesaveError](interfaces/CallbackForcesaveError.md) | The document server failed to build the document saved while being edited.                                               |
| [CallbackHandlers](interfaces/CallbackHandlers.md)             | What is done with each event. A kind with no handler is taken as it is.                                                  |
| [CallbackHistory](interfaces/CallbackHistory.md)               | The changes the saved document carries, as the editor's `refreshHistory` takes them.                                     |
| [CallbackInput](interfaces/CallbackInput.md)                   | A request to the callback URL, taken apart by the framework that received it.                                            |
| [CallbackOptions](interfaces/CallbackOptions.md)               | How a callback is checked.                                                                                               |
| [CallbackReply](interfaces/CallbackReply.md)                   | Body of the answer the document server expects: `0` taken, anything else to be retried.                                  |
| [CallbackSave](interfaces/CallbackSave.md)                     | Every editor is closed and the document changed: download it from `url` and store it.                                    |
| [CallbackSaveError](interfaces/CallbackSaveError.md)           | The document server failed to build the document to be saved.                                                            |
| [CallbackUnknown](interfaces/CallbackUnknown.md)               | A status this SDK does not know yet.                                                                                     |
| [CallbackVerifier](interfaces/CallbackVerifier.md)             | What checks the token of a callback: [DocumentServerJwt](../jwt/classes/DocumentServerJwt.md) or a verifier of your own. |
| [HandleOptions](interfaces/HandleOptions.md)                   | Overrides of how [DocumentServerCallback.handle](classes/DocumentServerCallback.md#handle) answers.                      |

## Type Aliases

| Type Alias                                               | Description                                                                                                                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CallbackActionType](type-aliases/CallbackActionType.md) | What a user did: `0` disconnected, `1` connected, `2` asked for a save.                                                                                                                                               |
| [CallbackErrorKind](type-aliases/CallbackErrorKind.md)   | Why a callback was refused, and the discriminant of [CallbackError](classes/CallbackError.md).                                                                                                                        |
| [CallbackEvent](type-aliases/CallbackEvent.md)           | What the document server reports, told apart by `kind`.                                                                                                                                                               |
| [CallbackEventKind](type-aliases/CallbackEventKind.md)   | Which of the events it is, and the discriminant of [CallbackEvent](type-aliases/CallbackEvent.md).                                                                                                                    |
| [CallbackHeaders](type-aliases/CallbackHeaders.md)       | Headers of a request, as the `Headers` of fetch or as the plain object of Node.                                                                                                                                       |
| [CallbackStatus](type-aliases/CallbackStatus.md)         | What the document server reports of a document: `1` being edited, `2` ready to be saved, `3` failed to be saved, `4` closed with no changes, `6` saved while being edited, `7` failed to be saved while being edited. |
| [ForcesaveType](type-aliases/ForcesaveType.md)           | What set a save off while the document was edited: `0` a command, `1` the save button, `2` a timer, `3` a submitted form.                                                                                             |
