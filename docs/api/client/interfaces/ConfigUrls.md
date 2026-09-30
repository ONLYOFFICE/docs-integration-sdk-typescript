[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / ConfigUrls

# Interface: ConfigUrls

Paths of the endpoints the document server serves, relative to its base URL.

## Properties

| Property                                                       | Type     | Description                                                                                                                    |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-api"></a> `api`                                | `string` | Script that loads the editor API, such as `"/web-apps/apps/api/documents/api.js"`.                                             |
| <a id="property-command"></a> `command`                        | `string` | -                                                                                                                              |
| <a id="property-converter"></a> `converter`                    | `string` | -                                                                                                                              |
| <a id="property-converterfromfile"></a> `converterFromFile?`   | `string` | The conversion of a document sent along with the request, `"/converter/from-file"`. Absent on a document server that has none. |
| <a id="property-docbuilder"></a> `docbuilder`                  | `string` | -                                                                                                                              |
| <a id="property-docbuilderfromfile"></a> `docbuilderFromFile?` | `string` | The builder of a script sent along with the request, `"/docbuilder/from-file"`. Absent on a document server that has none.     |
