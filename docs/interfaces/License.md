[@onlyoffice/docs-integration-sdk](../README.md) / License

# Interface: License

Terms of the license the document server runs under.

## Properties

| Property                                         | Type      | Description                                                               |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------- |
| <a id="connections"></a> `connections`           | `number`  | Editing connections the license allows. `0` when it counts users instead. |
| <a id="connections_view"></a> `connections_view` | `number`  | Live viewer connections the license allows.                               |
| <a id="customization"></a> `customization`       | `boolean` | Whether the editor interface may be customized.                           |
| <a id="end_date"></a> `end_date`                 | `string`  | Expiry date of the license, in ISO 8601.                                  |
| <a id="trial"></a> `trial`                       | `boolean` | Whether the license is a trial one.                                       |
| <a id="users_count"></a> `users_count`           | `number`  | Editing users the license allows. `0` when it counts connections instead. |
| <a id="users_expire"></a> `users_expire`         | `number`  | Days a user stays counted against the quota.                              |
| <a id="users_view_count"></a> `users_view_count` | `number`  | Live viewer users the license allows.                                     |
