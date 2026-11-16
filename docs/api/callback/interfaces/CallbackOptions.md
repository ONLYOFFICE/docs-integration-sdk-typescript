[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackOptions

# Interface: CallbackOptions

How [DocumentServerCallback.parse](../classes/DocumentServerCallback.md#parse) checks a callback.

## Properties

| Property                                  | Type                                                | Description                                                                                                                                                                                                                                            |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-verifier"></a> `verifier` | [`CallbackVerifier`](CallbackVerifier.md) \| `null` | Checks the token of the callback. Required, so the check can't be turned off by forgetting an option. `null` accepts unsigned callbacks, for a document server without a JWT secret. A token the callback carries is then neither checked nor trusted. |
