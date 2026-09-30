[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / BuildRequest

# Interface: BuildRequest

Starts a build: the document server downloads the script and runs it.

## Extends

- `Builder`

## Properties

| Property                                   | Type                                                    | Description                                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-argument"></a> `argument?` | [`BuilderArgument`](../type-aliases/BuilderArgument.md) | Values for the script, read through its `Argument` global.                                                                                                                                             |
| <a id="property-async"></a> `async?`       | `boolean`                                               | Return as soon as the build is queued instead of waiting for it. Repeat the request with the key it answered until `end` turns `true`. Default: `false`.                                               |
| <a id="property-key"></a> `key?`           | `string`                                                | Identifier of the build. The service mints one of its own when it is left out.                                                                                                                         |
| <a id="property-token"></a> `token?`       | `string`                                                | A token signed over this body, from [DocumentServerJwt.sign()](../../jwt/classes/DocumentServerJwt.md#sign). Required once the document server has a JWT secret, unless the token is sent in a header. |
| <a id="property-url"></a> `url`            | `string`                                                | Absolute URL of the `.js` script to run.                                                                                                                                                               |
