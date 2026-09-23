[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / ConfigAuthorization

# Interface: ConfigAuthorization

Where the document server expects the JWT of a request.

## Properties

| Property                     | Type     | Description                                                       |
| ---------------------------- | -------- | ----------------------------------------------------------------- |
| <a id="header"></a> `header` | `string` | Name of the header carrying the token, such as `"Authorization"`. |
| <a id="prefix"></a> `prefix` | `string` | Prefix the token is written behind, such as `"Bearer "`.          |
