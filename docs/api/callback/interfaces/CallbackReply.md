[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackReply

# Interface: CallbackReply

The reply to a callback: `0` handled, `1` not handled.

## See

[Response from the document storage service](https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#response-from-the-document-storage-service)

## Properties

| Property                            | Modifier   | Type       | Description                                             |
| ----------------------------------- | ---------- | ---------- | ------------------------------------------------------- |
| <a id="property-error"></a> `error` | `readonly` | `0` \| `1` | `0` when the callback was handled, `1` when it was not. |
