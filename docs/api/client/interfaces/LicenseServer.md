[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / LicenseServer

# Interface: LicenseServer

Build of the document server, and the verdict on its license.

## Properties

| Property                                          | Type              | Description                                                                 |
| ------------------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| <a id="property-builddate"></a> `buildDate`       | `string`          | Date the build was made, in ISO 8601.                                       |
| <a id="property-buildnumber"></a> `buildNumber`   | `number`          | Build number.                                                               |
| <a id="property-buildversion"></a> `buildVersion` | `string`          | Version of the build, such as `"8.2.0"`.                                    |
| <a id="property-packagetype"></a> `packageType`   | `0` \| `1` \| `2` | Edition: `0` community, `1` enterprise, `2` developer.                      |
| <a id="property-resulttype"></a> `resultType`     | `number`          | State of the license: `1` error, `2` expired, `3` valid, `6` trial expired. |
