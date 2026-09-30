[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuilderResponse

# Interface: BuilderResponse

The body of a response from `/docbuilder` and `/docbuilder/from-file`: the state of the
build, or an `error` code and nothing else. The client throws on the code.

## Properties

| Property                             | Type                                                      | Description                                                                                     |
| ------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| <a id="property-end"></a> `end?`     | `boolean`                                                 | Whether the build has finished. `urls` arrives along with it.                                   |
| <a id="property-error"></a> `error?` | [`BuilderErrorCode`](../type-aliases/BuilderErrorCode.md) | The error code, on a failed build. See [BuilderErrorCode](../type-aliases/BuilderErrorCode.md). |
| <a id="property-key"></a> `key?`     | `string`                                                  | Identifier of the build, to be sent back in every request that follows.                         |
| <a id="property-urls"></a> `urls?`   | `Record`\<`string`, `string`\>                            | URL of each generated file, keyed by the name the script saved it under.                        |
