[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackHandlers

# Interface: CallbackHandlers

The handlers [DocumentServerCallback.handle](../classes/DocumentServerCallback.md#handle) runs, one for each event kind. A handler
may return a promise; the reply waits for it.

## Properties

| Property                                                 | Type                                       | Description                                                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-closed"></a> `closed?`                   | (`event`) => `void` \| `Promise`\<`void`\> | Status `4`: the last editor closed and nothing changed. Without a handler, answered `ok`.                                                                                                                               |
| <a id="property-editing"></a> `editing?`                 | (`event`) => `void` \| `Promise`\<`void`\> | Status `1`: a user connected or disconnected. Without a handler, answered `ok`.                                                                                                                                         |
| <a id="property-forcesave"></a> `forcesave?`             | (`event`) => `void` \| `Promise`\<`void`\> | Status `6`: the document was saved while it is edited. Download `url` and store a version. Without a handler, answered `fail`, and `onError` gets a [CallbackError](../classes/CallbackError.md) of kind `"unhandled"`. |
| <a id="property-forcesave-error"></a> `forcesave-error?` | (`event`) => `void` \| `Promise`\<`void`\> | Status `7`: that save failed. Without a handler, answered `ok`.                                                                                                                                                         |
| <a id="property-save"></a> `save`                        | (`event`) => `void` \| `Promise`\<`void`\> | Status `2`: the last editor closed and the document changed. Download `url` and store the document. Required: a document not stored here is lost.                                                                       |
| <a id="property-save-error"></a> `save-error?`           | (`event`) => `void` \| `Promise`\<`void`\> | Status `3`: the document server failed to build the document. Without a handler, answered `ok`.                                                                                                                         |
| <a id="property-unknown"></a> `unknown?`                 | (`event`) => `void` \| `Promise`\<`void`\> | A status this SDK doesn't know. Without a handler, answered `ok`.                                                                                                                                                       |
