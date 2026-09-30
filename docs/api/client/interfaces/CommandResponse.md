[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / CommandResponse

# Interface: CommandResponse

The body of a response from `/command`. Only `error` is always there. Which other fields come
depends on the command, and a failed command has the code alone.

## Properties

| Property                                 | Type                                                      | Description                                                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-error"></a> `error`      | [`CommandErrorCode`](../type-aliases/CommandErrorCode.md) | `0` on success, `4` when `forcesave` found nothing to save. See [CommandErrorCode](../type-aliases/CommandErrorCode.md).                      |
| <a id="property-key"></a> `key?`         | `string`                                                  | Identifier of the document the command was about.                                                                                             |
| <a id="property-keys"></a> `keys?`       | `string`[]                                                | Identifiers of the forgotten documents. Answers `getForgottenList`.                                                                           |
| <a id="property-license"></a> `license?` | [`License`](License.md)                                   | The terms of the license. Answers `license`.                                                                                                  |
| <a id="property-quota"></a> `quota?`     | [`LicenseQuota`](LicenseQuota.md)                         | The users counted against the license. Answers `license`.                                                                                     |
| <a id="property-server"></a> `server?`   | [`LicenseServer`](LicenseServer.md)                       | The build of the document server and the state of its license. Answers `license`.                                                             |
| <a id="property-url"></a> `url?`         | `string`                                                  | URL the forgotten document can be downloaded from. Answers `getForgotten`.                                                                    |
| <a id="property-users"></a> `users?`     | `string`[]                                                | Identifiers of the users who have the document open for editing, or, once it has been changed, of the one who edited it last. Answers `info`. |
| <a id="property-version"></a> `version?` | `string`                                                  | Version of the document server, such as `"8.2.0.1"`. Answers `version`.                                                                       |
