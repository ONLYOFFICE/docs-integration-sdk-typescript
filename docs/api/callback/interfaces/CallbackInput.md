[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackInput

# Interface: CallbackInput

A callback request taken apart, for a framework that parses the body itself.

## Properties

| Property                                 | Type                                                    | Description                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| <a id="property-body"></a> `body`        | `unknown`                                               | The body: parsed JSON, or the raw body as a string, a `Uint8Array` (a `Buffer` included) or an `ArrayBuffer`. |
| <a id="property-headers"></a> `headers?` | [`CallbackHeaders`](../type-aliases/CallbackHeaders.md) | The headers of the request. Needed when the document server signs callbacks in a header.                      |
