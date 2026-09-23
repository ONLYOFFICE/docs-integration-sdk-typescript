[@onlyoffice/docs-integration-sdk](../README.md) / [client](../modules/client.md) / CommandResponse

# Interface: CommandResponse

Body of a response from the command service.

Only `error` is always there; which of the rest arrive depends on the command that was
sent, and a failed command carries the code alone.

## Properties

| Property                        | Type                                                      | Description                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="error"></a> `error`      | [`CommandErrorCode`](../types/client.CommandErrorCode.md) | -                                                                                                                                             |
| <a id="key"></a> `key?`         | `string`                                                  | Identifier of the document the command was about.                                                                                             |
| <a id="keys"></a> `keys?`       | `string`[]                                                | Identifiers of the forgotten documents. Answers `getForgottenList`.                                                                           |
| <a id="license"></a> `license?` | [`License`](client.License.md)                            | -                                                                                                                                             |
| <a id="quota"></a> `quota?`     | [`LicenseQuota`](client.LicenseQuota.md)                  | -                                                                                                                                             |
| <a id="server"></a> `server?`   | [`LicenseServer`](client.LicenseServer.md)                | -                                                                                                                                             |
| <a id="url"></a> `url?`         | `string`                                                  | URL the forgotten document can be downloaded from. Answers `getForgotten`.                                                                    |
| <a id="users"></a> `users?`     | `string`[]                                                | Identifiers of the users who have the document open for editing, or, once it has been changed, of the one who edited it last. Answers `info`. |
| <a id="version"></a> `version?` | `string`                                                  | Version of the document server, such as `"8.2.0.1"`. Answers `version`.                                                                       |
