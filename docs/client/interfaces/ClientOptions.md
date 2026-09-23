[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ClientOptions

# Interface: ClientOptions

Settings of a client, applied to every request it sends.

## Properties

| Property                                                         | Type                                        | Description                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-authorizationheader"></a> `authorizationHeader?` | `string`                                    | Header a token is sent in. Default: `"Authorization"`.                                                                                                     |
| <a id="property-authorizationprefix"></a> `authorizationPrefix?` | `string`                                    | Written before the token in that header. Default: `"Bearer "`.                                                                                             |
| <a id="property-baseurl"></a> `baseUrl`                          | `string`                                    | Base URL of the document server, such as `"https://docs.example.com"`. Required.                                                                           |
| <a id="property-fetch"></a> `fetch?`                             | (`url`, `init?`) => `Promise`\<`Response`\> | A `fetch` of your own: a proxy, mTLS, retries, logging, mocking. Default: the global `fetch`, looked up on each call rather than captured at construction. |
| <a id="property-headers"></a> `headers?`                         | `Record`\<`string`, `string`\>              | Headers sent with every request.                                                                                                                           |
| <a id="property-timeoutms"></a> `timeoutMs?`                     | `number`                                    | Deadline for a request, in whole milliseconds from `1` to `2147483647`. Default: `30000`.                                                                  |
