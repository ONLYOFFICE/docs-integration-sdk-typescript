[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / ClientOptions

# Interface: ClientOptions

Settings of a client, applied to every request it sends.

## Properties

| Property                                                | Type                                        | Description                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="authorizationheader"></a> `authorizationHeader?` | `string`                                    | Header a token is sent in. Default: `"Authorization"`.                                                                                                     |
| <a id="authorizationprefix"></a> `authorizationPrefix?` | `string`                                    | Written before the token in that header. Default: `"Bearer "`.                                                                                             |
| <a id="baseurl"></a> `baseUrl`                          | `string`                                    | Base URL of the document server, such as `"https://docs.example.com"`. Required.                                                                           |
| <a id="fetch"></a> `fetch?`                             | (`url`, `init?`) => `Promise`\<`Response`\> | A `fetch` of your own: a proxy, mTLS, retries, logging, mocking. Default: the global `fetch`, looked up on each call rather than captured at construction. |
| <a id="headers"></a> `headers?`                         | `Record`\<`string`, `string`\>              | Headers sent with every request.                                                                                                                           |
| <a id="timeoutms"></a> `timeoutMs?`                     | `number`                                    | Deadline for a request, in whole milliseconds from `1` to `2147483647`. Default: `30000`.                                                                  |
