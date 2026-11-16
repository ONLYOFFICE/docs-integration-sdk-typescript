[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / RequestOptions

# Interface: RequestOptions

Overrides for one call, over the client options.

## Properties

| Property                                     | Type                                         | Description                                                                                                             |
| -------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| <a id="property-headers"></a> `headers?`     | `Readonly`\<`Record`\<`string`, `string`\>\> | Headers laid over all others: the configured ones and those the SDK sets itself. Names are matched in any case.         |
| <a id="property-signal"></a> `signal?`       | `AbortSignal`                                | Cancels the call, which then rejects with the reason of the signal, unchanged. The deadline still applies alongside it. |
| <a id="property-timeoutms"></a> `timeoutMs?` | `number`                                     | The deadline of this call, instead of the configured one. Validated the same way.                                       |
