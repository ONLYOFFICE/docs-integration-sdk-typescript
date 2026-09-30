[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuilderResponse

# Interface: BuilderResponse

Body of a response from the builder service.

Either the build reports its state or it reports an `error`, so a body that carries a
code carries nothing else.

## Properties

| Property                             | Type                                                      | Description                                                              |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| <a id="property-end"></a> `end?`     | `boolean`                                                 | Whether the build has finished. `urls` arrives along with it.            |
| <a id="property-error"></a> `error?` | [`BuilderErrorCode`](../type-aliases/BuilderErrorCode.md) | -                                                                        |
| <a id="property-key"></a> `key?`     | `string`                                                  | Identifier of the build, to be sent back in every request that follows.  |
| <a id="property-urls"></a> `urls?`   | `Record`\<`string`, `string`\>                            | URL of each generated file, keyed by the name the script saved it under. |
