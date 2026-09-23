[@onlyoffice/docs-integration-sdk](../README.md) / client

# client

The HTTP client of the document server: conversion, commands, the document builder and
what the server says of itself. Imported from `@onlyoffice/docs-integration-sdk/client`.

## Classes

| Class                                                                     | Description                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BuilderError](../classes/client.BuilderError.md)                         | The builder service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                   |
| [CommandError](../classes/client.CommandError.md)                         | The command service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                   |
| [ConversionError](../classes/client.ConversionError.md)                   | The conversion service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                |
| [DocumentServerClient](../classes/client.DocumentServerClient.md)         | The document server endpoints, each parsing the answer into the type its endpoint promises and rejecting when the server reports a failure — in the status, or, the way the conversion, command and builder services do, in a body it answered `200 OK` with. |
| [DocumentServerError](../classes/client.DocumentServerError.md)           | Everything the document server answers with that the SDK turns into a rejection.                                                                                                                                                                              |
| [DocumentServerHttpError](../classes/client.DocumentServerHttpError.md)   | The document server answered with a status outside the 2xx range.                                                                                                                                                                                             |
| [DocumentServerParseError](../classes/client.DocumentServerParseError.md) | The body of a successful response was not the JSON the endpoint promises.                                                                                                                                                                                     |
| [DocumentServerRawClient](../classes/client.DocumentServerRawClient.md)   | The same endpoints as [DocumentServerClient](../classes/client.DocumentServerClient.md), each answering with the untouched `Response` and none of them throwing on what the document server says.                                                             |

## Interfaces

| Interface                                                                  | Description                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [BuilderResponse](../interfaces/client.BuilderResponse.md)                 | Body of a response from the builder service.                                 |
| [BuildRequest](../interfaces/client.BuildRequest.md)                       | Starts a build: the document server downloads the script and runs it.        |
| [BuildResultRequest](../interfaces/client.BuildResultRequest.md)           | Collects the result of an asynchronous build.                                |
| [ClientOptions](../interfaces/client.ClientOptions.md)                     | Settings of a client, applied to every request it sends.                     |
| [CommandResponse](../interfaces/client.CommandResponse.md)                 | Body of a response from the command service.                                 |
| [ConfigAuthorization](../interfaces/client.ConfigAuthorization.md)         | Where the document server expects the JWT of a request.                      |
| [ConfigLimits](../interfaces/client.ConfigLimits.md)                       | Bounds the document server enforces.                                         |
| [ConfigResponse](../interfaces/client.ConfigResponse.md)                   | Body of a response from the configuration endpoint.                          |
| [ConfigUrls](../interfaces/client.ConfigUrls.md)                           | Paths of the endpoints the document server serves, relative to its base URL. |
| [ConvertRequest](../interfaces/client.ConvertRequest.md)                   | Body of a request to the conversion service.                                 |
| [ConvertResponse](../interfaces/client.ConvertResponse.md)                 | Body of a response from the conversion service.                              |
| [DeleteForgottenCommand](../interfaces/client.DeleteForgottenCommand.md)   | Removes a document the editors left behind.                                  |
| [DocumentLayout](../interfaces/client.DocumentLayout.md)                   | Layout of a form printed to PDF or to an image.                              |
| [DocumentMeta](../interfaces/client.DocumentMeta.md)                       | New metadata of a document.                                                  |
| [DocumentRenderer](../interfaces/client.DocumentRenderer.md)               | How a PDF, XPS or OXPS source document is read.                              |
| [DropCommand](../interfaces/client.DropCommand.md)                         | Disconnects users from co-editing, leaving them with view access.            |
| [ForcesaveCommand](../interfaces/client.ForcesaveCommand.md)               | Saves the document being edited without closing it.                          |
| [Format](../interfaces/client.Format.md)                                   | A file format the document server knows.                                     |
| [GetForgottenCommand](../interfaces/client.GetForgottenCommand.md)         | Asks for the URL a forgotten document can be downloaded from.                |
| [GetForgottenListCommand](../interfaces/client.GetForgottenListCommand.md) | Lists the documents the editors left behind.                                 |
| [InfoCommand](../interfaces/client.InfoCommand.md)                         | Asks who has the document open.                                              |
| [License](../interfaces/client.License.md)                                 | Terms of the license the document server runs under.                         |
| [LicenseCommand](../interfaces/client.LicenseCommand.md)                   | Asks for the license and for the quota spent against it.                     |
| [LicenseQuota](../interfaces/client.LicenseQuota.md)                       | Users counted against the license since the document server was started.     |
| [LicenseQuotaUser](../interfaces/client.LicenseQuotaUser.md)               | A user counted against the license quota.                                    |
| [LicenseServer](../interfaces/client.LicenseServer.md)                     | Build of the document server, and the verdict on its license.                |
| [MetaCommand](../interfaces/client.MetaCommand.md)                         | Renames the document in every editor that has it open.                       |
| [PageMargins](../interfaces/client.PageMargins.md)                         | Page margins, in CSS-like units such as `"17.8mm"`.                          |
| [PageSize](../interfaces/client.PageSize.md)                               | Size of a page, in CSS-like units such as `"210mm"`.                         |
| [PdfOptions](../interfaces/client.PdfOptions.md)                           | PDF output settings.                                                         |
| [RequestOptions](../interfaces/client.RequestOptions.md)                   | Overrides applied to a single request, on top of the client options.         |
| [SpreadsheetLayout](../interfaces/client.SpreadsheetLayout.md)             | Layout used when a spreadsheet is converted to PDF or to an image.           |
| [Thumbnail](../interfaces/client.Thumbnail.md)                             | Settings for an image output format: BMP, GIF, JPG or PNG.                   |
| [VersionCommand](../interfaces/client.VersionCommand.md)                   | Asks for the version of the document server.                                 |
| [Watermark](../interfaces/client.Watermark.md)                             | Watermark stamped onto a PDF or image output.                                |
| [WatermarkParagraph](../interfaces/client.WatermarkParagraph.md)           | A line of watermark text.                                                    |
| [WatermarkRun](../interfaces/client.WatermarkRun.md)                       | A styled piece of watermark text.                                            |

## Type Aliases

| Type Alias                                                            | Description                                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [AnyDocumentServerError](../types/client.AnyDocumentServerError.md)   | Every error the SDK throws of its own accord.                                                                       |
| [BuilderArgument](../types/client.BuilderArgument.md)                 | Values the builder script reads back through its `Argument` global.                                                 |
| [BuilderErrorCode](../types/client.BuilderErrorCode.md)               | Why a build failed:                                                                                                 |
| [BuilderRequest](../types/client.BuilderRequest.md)                   | Body of a request to the builder service.                                                                           |
| [CommandErrorCode](../types/client.CommandErrorCode.md)               | Why a command failed:                                                                                               |
| [CommandRequest](../types/client.CommandRequest.md)                   | Body of a request to the command service.                                                                           |
| [CommandType](../types/client.CommandType.md)                         | Name of a command the service accepts.                                                                              |
| [ConversionErrorCode](../types/client.ConversionErrorCode.md)         | Why a conversion failed:                                                                                            |
| [CsvDelimiter](../types/client.CsvDelimiter.md)                       | Column separator for CSV input: none, tab, semicolon, colon, comma or space.                                        |
| [DocumentServerErrorKind](../types/client.DocumentServerErrorKind.md) | Which failure an error stands for, and the discriminant of the union below.                                         |
| [FormatAction](../types/client.FormatAction.md)                       | Something the editors can do with a format.                                                                         |
| [FormatsResponse](../types/client.FormatsResponse.md)                 | Body of a response from the formats endpoint: every format the document server knows.                               |
| [FormatType](../types/client.FormatType.md)                           | Editor a format opens in, or the empty string for one that is only ever produced by a conversion, such as an image. |
| [RgbColor](../types/client.RgbColor.md)                               | Red, green and blue components, each 0–255.                                                                         |
| [TextAssociation](../types/client.TextAssociation.md)                 | How a PDF, XPS or OXPS page is split into text blocks while it is read.                                             |
