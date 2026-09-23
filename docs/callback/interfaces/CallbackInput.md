[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackInput

# Interface: CallbackInput

A request to the callback URL, taken apart by the framework that received it.

## Properties

| Property                                 | Type                                                    | Description                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-body"></a> `body`        | `unknown`                                               | The body: parsed already, or as the text or the bytes it came in — a string, a `Uint8Array` or `Buffer`, or an `ArrayBuffer`. |
| <a id="property-headers"></a> `headers?` | [`CallbackHeaders`](../type-aliases/CallbackHeaders.md) | -                                                                                                                             |
