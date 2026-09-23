[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / License

# Interface: License

Terms of the license the document server runs under.

## Properties

| Property                                                  | Type      | Description                                                               |
| --------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| <a id="property-connections"></a> `connections`           | `number`  | Editing connections the license allows. `0` when it counts users instead. |
| <a id="property-connections_view"></a> `connections_view` | `number`  | Live viewer connections the license allows.                               |
| <a id="property-customization"></a> `customization`       | `boolean` | Whether the editor interface may be customized.                           |
| <a id="property-end_date"></a> `end_date`                 | `string`  | Expiry date of the license, in ISO 8601.                                  |
| <a id="property-trial"></a> `trial`                       | `boolean` | Whether the license is a trial one.                                       |
| <a id="property-users_count"></a> `users_count`           | `number`  | Editing users the license allows. `0` when it counts connections instead. |
| <a id="property-users_expire"></a> `users_expire`         | `number`  | Days a user stays counted against the quota.                              |
| <a id="property-users_view_count"></a> `users_view_count` | `number`  | Live viewer users the license allows.                                     |
