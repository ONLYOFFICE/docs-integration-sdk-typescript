[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuildResultRequest

# Interface: BuildResultRequest

Collects the result of an asynchronous build.

## Extends

- `Builder`

## Properties

| Property                             | Type      | Description                                                                                                                                              |
| ------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-async"></a> `async?` | `boolean` | Return as soon as the build is queued instead of waiting for it. Repeat the request with the key it answered until `end` turns `true`. Default: `false`. |
| <a id="property-key"></a> `key`      | `string`  | Identifier of the build, as the service returned it.                                                                                                     |
| <a id="property-token"></a> `token?` | `string`  | JWT signature of this body. Required once the document server has a secret.                                                                              |
