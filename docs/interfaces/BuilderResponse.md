[@onlyoffice/docs-integration-sdk](../README.md) / BuilderResponse

# Interface: BuilderResponse

Body of a response from the builder service.

Either the build reports its state or it reports an `error`, so a body that carries a
code carries nothing else.

## Properties

| Property                    | Type                                               | Description                                                              |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| <a id="end"></a> `end?`     | `boolean`                                          | Whether the build has finished. `urls` arrives along with it.            |
| <a id="error"></a> `error?` | [`BuilderErrorCode`](../types/BuilderErrorCode.md) | -                                                                        |
| <a id="key"></a> `key?`     | `string`                                           | Identifier of the build, to be sent back in every request that follows.  |
| <a id="urls"></a> `urls?`   | `Record`\<`string`, `string`\>                     | URL of each generated file, keyed by the name the script saved it under. |
