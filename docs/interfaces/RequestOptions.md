[@onlyoffice/docs-integration-sdk](../README.md) / RequestOptions

# Interface: RequestOptions

Overrides applied to a single request, on top of the client options.

## Properties

| Property                            | Type                                         | Description                                                                  |
| ----------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| <a id="headers"></a> `headers?`     | `Readonly`\<`Record`\<`string`, `string`\>\> | Headers laid over the configured ones. Names are matched case-insensitively. |
| <a id="signal"></a> `signal?`       | `AbortSignal`                                | Aborts the request. The configured timeout still applies alongside it.       |
| <a id="timeoutms"></a> `timeoutMs?` | `number`                                     | Deadline for this request, in place of the configured one.                   |
