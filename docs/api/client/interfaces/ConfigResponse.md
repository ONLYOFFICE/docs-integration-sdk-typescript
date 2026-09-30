[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConfigResponse

# Interface: ConfigResponse

The body of a response from `/meta/config`.

## Properties

| Property                                            | Type                                            | Description                                                                                                |
| --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| <a id="property-authorization"></a> `authorization` | [`ConfigAuthorization`](ConfigAuthorization.md) | Where the server expects a token. Set `authorizationHeader` and `authorizationPrefix` of the client to it. |
| <a id="property-langs"></a> `langs`                 | `string`[]                                      | Language tags the editor interface is translated into, such as `"pt-PT"`.                                  |
| <a id="property-limits"></a> `limits`               | [`ConfigLimits`](ConfigLimits.md)               | The bounds the server enforces.                                                                            |
| <a id="property-urls"></a> `urls`                   | [`ConfigUrls`](ConfigUrls.md)                   | The paths of its endpoints.                                                                                |
