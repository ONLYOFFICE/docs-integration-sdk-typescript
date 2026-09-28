[@onlyoffice/docs-integration-sdk](../README.md) / client

# client

The HTTP client of the document server: conversion, commands, the document builder and
what the server says of itself. Imported from `@onlyoffice/docs-integration-sdk/client`.

## Classes

| Class                                                               | Description                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BuilderError](classes/BuilderError.md)                             | The builder service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                                                                                                                                               |
| [CommandError](classes/CommandError.md)                             | The command service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                                                                                                                                               |
| [ConversionError](classes/ConversionError.md)                       | The conversion service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                                                                                                                                            |
| [DocumentServerClient](classes/DocumentServerClient.md)             | The document server endpoints, each parsing the answer into the type its endpoint promises and rejecting when the server reports a failure — in the status, or, the way the conversion, command and builder services do, in a body it answered `200 OK` with.                                                                                                                             |
| [DocumentServerError](classes/DocumentServerError.md)               | Every failure of a call to the document server that the SDK turns into a rejection: a failure the server reports, an answer that is not the one promised, or no answer at all.                                                                                                                                                                                                            |
| [DocumentServerHttpError](classes/DocumentServerHttpError.md)       | The document server answered with a status outside the 2xx range.                                                                                                                                                                                                                                                                                                                         |
| [DocumentServerNetworkError](classes/DocumentServerNetworkError.md) | No answer came: the document server could not be reached, or the connection broke before its answer had been read. The error `fetch` raised is the `cause`.                                                                                                                                                                                                                               |
| [DocumentServerParseError](classes/DocumentServerParseError.md)     | The body of a successful response was not the JSON the endpoint promises.                                                                                                                                                                                                                                                                                                                 |
| [DocumentServerRawClient](classes/DocumentServerRawClient.md)       | The same endpoints as [DocumentServerClient](classes/DocumentServerClient.md), each answering with the untouched `Response` and none of them throwing on what the document server says. A request that gets no answer still rejects, with a [DocumentServerNetworkError](classes/DocumentServerNetworkError.md) or a [DocumentServerTimeoutError](classes/DocumentServerTimeoutError.md). |
| [DocumentServerTimeoutError](classes/DocumentServerTimeoutError.md) | The deadline of the call ran out before the answer had been read. The `DOMException` the abort raised is the `cause`.                                                                                                                                                                                                                                                                     |

## Interfaces

| Interface                                                        | Description                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [BuilderResponse](interfaces/BuilderResponse.md)                 | Body of a response from the builder service.                                   |
| [BuildRequest](interfaces/BuildRequest.md)                       | Starts a build: the document server downloads the script and runs it.          |
| [BuildResultRequest](interfaces/BuildResultRequest.md)           | Collects the result of an asynchronous build.                                  |
| [ClientOptions](interfaces/ClientOptions.md)                     | Settings of a client, applied to every request it sends.                       |
| [CommandResponse](interfaces/CommandResponse.md)                 | Body of a response from the command service.                                   |
| [ConfigAuthorization](interfaces/ConfigAuthorization.md)         | Where the document server expects the JWT of a request.                        |
| [ConfigLimits](interfaces/ConfigLimits.md)                       | Bounds the document server enforces.                                           |
| [ConfigResponse](interfaces/ConfigResponse.md)                   | Body of a response from the configuration endpoint.                            |
| [ConfigUrls](interfaces/ConfigUrls.md)                           | Paths of the endpoints the document server serves, relative to its base URL.   |
| [ConvertRequest](interfaces/ConvertRequest.md)                   | Body of a request to the conversion service.                                   |
| [ConvertResponse](interfaces/ConvertResponse.md)                 | Body of a response from the conversion service.                                |
| [DeleteForgottenCommand](interfaces/DeleteForgottenCommand.md)   | Removes a document the editors left behind.                                    |
| [DocumentLayout](interfaces/DocumentLayout.md)                   | Layout of a form printed to PDF or to an image.                                |
| [DocumentMeta](interfaces/DocumentMeta.md)                       | New metadata of a document.                                                    |
| [DocumentRenderer](interfaces/DocumentRenderer.md)               | How a PDF, XPS or OXPS source document is read.                                |
| [DropCommand](interfaces/DropCommand.md)                         | Disconnects users from co-editing, leaving them with view access.              |
| [FileLocation](interfaces/FileLocation.md)                       | Path and query of a file the document server keeps, as `getFile()` takes them. |
| [ForcesaveCommand](interfaces/ForcesaveCommand.md)               | Saves the document being edited without closing it.                            |
| [Format](interfaces/Format.md)                                   | A file format the document server knows.                                       |
| [GetForgottenCommand](interfaces/GetForgottenCommand.md)         | Asks for the URL a forgotten document can be downloaded from.                  |
| [GetForgottenListCommand](interfaces/GetForgottenListCommand.md) | Lists the documents the editors left behind.                                   |
| [InfoCommand](interfaces/InfoCommand.md)                         | Asks who has the document open.                                                |
| [License](interfaces/License.md)                                 | Terms of the license the document server runs under.                           |
| [LicenseCommand](interfaces/LicenseCommand.md)                   | Asks for the license and for the quota spent against it.                       |
| [LicenseQuota](interfaces/LicenseQuota.md)                       | Users counted against the license since the document server was started.       |
| [LicenseQuotaUser](interfaces/LicenseQuotaUser.md)               | A user counted against the license quota.                                      |
| [LicenseServer](interfaces/LicenseServer.md)                     | Build of the document server, and the verdict on its license.                  |
| [MetaCommand](interfaces/MetaCommand.md)                         | Renames the document in every editor that has it open.                         |
| [PageMargins](interfaces/PageMargins.md)                         | Page margins, in CSS-like units such as `"17.8mm"`.                            |
| [PageSize](interfaces/PageSize.md)                               | Size of a page, in CSS-like units such as `"210mm"`.                           |
| [PdfOptions](interfaces/PdfOptions.md)                           | PDF output settings.                                                           |
| [RequestOptions](interfaces/RequestOptions.md)                   | Overrides applied to a single request, on top of the client options.           |
| [SpreadsheetLayout](interfaces/SpreadsheetLayout.md)             | Layout used when a spreadsheet is converted to PDF or to an image.             |
| [Thumbnail](interfaces/Thumbnail.md)                             | Settings for an image output format: BMP, GIF, JPG or PNG.                     |
| [VersionCommand](interfaces/VersionCommand.md)                   | Asks for the version of the document server.                                   |
| [Watermark](interfaces/Watermark.md)                             | Watermark stamped onto a PDF or image output.                                  |
| [WatermarkParagraph](interfaces/WatermarkParagraph.md)           | A line of watermark text.                                                      |
| [WatermarkRun](interfaces/WatermarkRun.md)                       | A styled piece of watermark text.                                              |

## Type Aliases

| Type Alias                                                         | Description                                                                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AnyDocumentServerError](type-aliases/AnyDocumentServerError.md)   | Every error the SDK throws of its own accord.                                                                                                           |
| [BuilderArgument](type-aliases/BuilderArgument.md)                 | Values the builder script reads back through its `Argument` global.                                                                                     |
| [BuilderErrorCode](type-aliases/BuilderErrorCode.md)               | Why a build failed:                                                                                                                                     |
| [BuilderRequest](type-aliases/BuilderRequest.md)                   | Body of a request to the builder service.                                                                                                               |
| [BuildFileRequest](type-aliases/BuildFileRequest.md)               | Starts a build of a script sent along with the request rather than downloaded from a `url`.                                                             |
| [CommandErrorCode](type-aliases/CommandErrorCode.md)               | Why a command failed:                                                                                                                                   |
| [CommandRequest](type-aliases/CommandRequest.md)                   | Body of a request to the command service.                                                                                                               |
| [CommandType](type-aliases/CommandType.md)                         | Name of a command the service accepts.                                                                                                                  |
| [ConversionErrorCode](type-aliases/ConversionErrorCode.md)         | Why a conversion failed:                                                                                                                                |
| [ConvertFileRequest](type-aliases/ConvertFileRequest.md)           | Body of a request to convert a document sent along with it, rather than one the document server downloads from `url`.                                   |
| [ConvertFileResult](type-aliases/ConvertFileResult.md)             | What a conversion of a document sent along with the request answers: the converted file, or, while an `async` one is still running, how far it has got. |
| [CsvDelimiter](type-aliases/CsvDelimiter.md)                       | Column separator for CSV input: none, tab, semicolon, colon, comma or space.                                                                            |
| [DocumentServerErrorKind](type-aliases/DocumentServerErrorKind.md) | Which failure an error stands for, and the discriminant of the union below.                                                                             |
| [FormatAction](type-aliases/FormatAction.md)                       | Something the editors can do with a format.                                                                                                             |
| [FormatsResponse](type-aliases/FormatsResponse.md)                 | Body of a response from the formats endpoint: every format the document server knows.                                                                   |
| [FormatType](type-aliases/FormatType.md)                           | Editor a format opens in, or the empty string for one that is only ever produced by a conversion, such as an image.                                     |
| [RgbColor](type-aliases/RgbColor.md)                               | Red, green and blue components, each 0–255.                                                                                                             |
| [TextAssociation](type-aliases/TextAssociation.md)                 | How a PDF, XPS or OXPS page is split into text blocks while it is read.                                                                                 |

## Functions

| Function                                  | Description                                                                                                                                                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [splitFileUrl](functions/splitFileUrl.md) | Splits a location the document server handed out — `url` in a callback, `fileUrl` in a conversion response, `url` in the answer to `getForgotten` — into the path and the query [DocumentServerClient.getFile](classes/DocumentServerClient.md#getfile) takes. |
