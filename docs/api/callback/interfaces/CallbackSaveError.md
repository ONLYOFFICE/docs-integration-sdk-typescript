[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackSaveError

# Interface: CallbackSaveError

The document server failed to build the document to be saved.

## Extends

- [`CallbackBody`](CallbackBody.md)

## Properties

| Property                                             | Type                                                | Description                                                                   |
| ---------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| <a id="property-actions"></a> `actions?`             | [`CallbackAction`](CallbackAction.md)[]             | -                                                                             |
| <a id="property-changesurl"></a> `changesurl?`       | `string`                                            | Where the archive of the changes is downloaded from.                          |
| <a id="property-filetype"></a> `filetype?`           | `string`                                            | Extension of the file at `url`, without the dot.                              |
| <a id="property-forcesavetype"></a> `forcesavetype?` | [`ForcesaveType`](../type-aliases/ForcesaveType.md) | -                                                                             |
| <a id="property-formsdataurl"></a> `formsdataurl?`   | `string`                                            | Where the data of a submitted form is downloaded from, as JSON.               |
| <a id="property-history"></a> `history?`             | [`CallbackHistory`](CallbackHistory.md)             | -                                                                             |
| <a id="property-key"></a> `key`                      | `string`                                            | Key of the document, as the editor config gave it.                            |
| <a id="property-kind"></a> `kind`                    | `"save-error"`                                      | -                                                                             |
| <a id="property-lastsave"></a> `lastsave?`           | `string`                                            | When the document was last saved, as an ISO 8601 date.                        |
| <a id="property-notmodified"></a> `notmodified?`     | `boolean`                                           | Whether the document is saved with no change since the last save.             |
| <a id="property-status"></a> `status`                | `3`                                                 | -                                                                             |
| <a id="property-token"></a> `token?`                 | `string`                                            | Token the body is signed with, when the document server signs it in the body. |
| <a id="property-url"></a> `url?`                     | `string`                                            | Where the document is downloaded from. Given with `2`, `3`, `6` and `7`.      |
| <a id="property-userdata"></a> `userdata?`           | `string`                                            | What the command that asked for the save carried as `userdata`.               |
| <a id="property-users"></a> `users?`                 | `string`[]                                          | Identifiers of the users who have the document open.                          |
