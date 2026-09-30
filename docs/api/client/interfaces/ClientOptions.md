[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ClientOptions

# Interface: ClientOptions

Settings of a client, applied to every request it sends.

## Properties

| Property                                                         | Type                                        | Description                                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-authorizationheader"></a> `authorizationHeader?` | `string`                                    | The header a token is sent in, when a method gets one. Set it to `authorization.header` of [DocumentServerClient.getConfig](../classes/DocumentServerClient.md#getconfig). Default: `"Authorization"`.                |
| <a id="property-authorizationprefix"></a> `authorizationPrefix?` | `string`                                    | What comes before the token in that header, as is: `""` sends a bare token. Set it to `authorization.prefix` of [DocumentServerClient.getConfig](../classes/DocumentServerClient.md#getconfig). Default: `"Bearer "`. |
| <a id="property-baseurl"></a> `baseUrl`                          | `string`                                    | The address of the document server, such as `"https://docs.example.com"`. Required. An absolute `http` or `https` URL; a path prefix is kept, a trailing slash, a query and a fragment are removed.                   |
| <a id="property-fetch"></a> `fetch?`                             | (`url`, `init?`) => `Promise`\<`Response`\> | A `fetch` of your own, for a proxy, mTLS, retries, logging or mocking. Default: the global `fetch`, looked up on each call, so a `fetch` patched later is still used.                                                 |
| <a id="property-headers"></a> `headers?`                         | `Record`\<`string`, `string`\>              | Headers sent with every request.                                                                                                                                                                                      |
| <a id="property-timeoutms"></a> `timeoutMs?`                     | `number`                                    | The deadline of a request, in whole milliseconds from `1` to `2147483647`. A request that runs out of time rejects with [DocumentServerTimeoutError](../classes/DocumentServerTimeoutError.md). Default: `30000`.     |
