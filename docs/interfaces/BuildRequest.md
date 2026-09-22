[@onlyoffice/docs-integration-sdk](../README.md) / BuildRequest

# Interface: BuildRequest

Starts a build: the document server downloads the script and runs it.

## Extends

- `Builder`

## Properties

| Property                          | Type                                             | Description                                                                                                                                              |
| --------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="argument"></a> `argument?` | [`BuilderArgument`](../types/BuilderArgument.md) | -                                                                                                                                                        |
| <a id="async"></a> `async?`       | `boolean`                                        | Return as soon as the build is queued instead of waiting for it. Repeat the request with the key it answered until `end` turns `true`. Default: `false`. |
| <a id="key"></a> `key?`           | `string`                                         | Identifier of the build. The service mints one of its own when it is left out.                                                                           |
| <a id="token"></a> `token?`       | `string`                                         | JWT signature of this body. Required once the document server has a secret.                                                                              |
| <a id="url"></a> `url`            | `string`                                         | Absolute URL of the `.js` script to run.                                                                                                                 |
