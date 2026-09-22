# @onlyoffice/docs-integration-sdk

## Classes

| Class                                                           | Description                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BuilderError](classes/BuilderError.md)                         | The builder service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                   |
| [CommandError](classes/CommandError.md)                         | The command service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                   |
| [ConversionError](classes/ConversionError.md)                   | The conversion service reported a failure in a body it answered `200 OK` with.                                                                                                                                                                                |
| [DocumentServerClient](classes/DocumentServerClient.md)         | The document server endpoints, each parsing the answer into the type its endpoint promises and rejecting when the server reports a failure — in the status, or, the way the conversion, command and builder services do, in a body it answered `200 OK` with. |
| [DocumentServerError](classes/DocumentServerError.md)           | Everything the document server answers with that the SDK turns into a rejection.                                                                                                                                                                              |
| [DocumentServerFormats](classes/DocumentServerFormats.md)       | The formats of `/meta/formats`, indexed by extension: what each one opens in, what the editors may do with it, what it converts to and what it is served as.                                                                                                  |
| [DocumentServerHttpError](classes/DocumentServerHttpError.md)   | The document server answered with a status outside the 2xx range.                                                                                                                                                                                             |
| [DocumentServerJwt](classes/DocumentServerJwt.md)               | Signs the tokens the document server expects, over the secret it is configured with.                                                                                                                                                                          |
| [DocumentServerParseError](classes/DocumentServerParseError.md) | The body of a successful response was not the JSON the endpoint promises.                                                                                                                                                                                     |
| [DocumentServerRawClient](classes/DocumentServerRawClient.md)   | The same endpoints as [DocumentServerClient](classes/DocumentServerClient.md), each answering with the untouched `Response` and none of them throwing on what the document server says.                                                                       |
| [JwtError](classes/JwtError.md)                                 | A token that could not be trusted: malformed, signed with another algorithm or another secret, expired, or not valid yet.                                                                                                                                     |

## Interfaces

| Interface                                                        | Description                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [BuilderResponse](interfaces/BuilderResponse.md)                 | Body of a response from the builder service.                                 |
| [BuildRequest](interfaces/BuildRequest.md)                       | Starts a build: the document server downloads the script and runs it.        |
| [BuildResultRequest](interfaces/BuildResultRequest.md)           | Collects the result of an asynchronous build.                                |
| [ClientOptions](interfaces/ClientOptions.md)                     | Settings of a client, applied to every request it sends.                     |
| [CommandResponse](interfaces/CommandResponse.md)                 | Body of a response from the command service.                                 |
| [ConfigAuthorization](interfaces/ConfigAuthorization.md)         | Where the document server expects the JWT of a request.                      |
| [ConfigLimits](interfaces/ConfigLimits.md)                       | Bounds the document server enforces.                                         |
| [ConfigResponse](interfaces/ConfigResponse.md)                   | Body of a response from the configuration endpoint.                          |
| [ConfigUrls](interfaces/ConfigUrls.md)                           | Paths of the endpoints the document server serves, relative to its base URL. |
| [ConvertRequest](interfaces/ConvertRequest.md)                   | Body of a request to the conversion service.                                 |
| [ConvertResponse](interfaces/ConvertResponse.md)                 | Body of a response from the conversion service.                              |
| [DeleteForgottenCommand](interfaces/DeleteForgottenCommand.md)   | Removes a document the editors left behind.                                  |
| [DocumentLayout](interfaces/DocumentLayout.md)                   | Layout of a form printed to PDF or to an image.                              |
| [DocumentMeta](interfaces/DocumentMeta.md)                       | New metadata of a document.                                                  |
| [DocumentRenderer](interfaces/DocumentRenderer.md)               | How a PDF, XPS or OXPS source document is read.                              |
| [DropCommand](interfaces/DropCommand.md)                         | Disconnects users from co-editing, leaving them with view access.            |
| [ForcesaveCommand](interfaces/ForcesaveCommand.md)               | Saves the document being edited without closing it.                          |
| [Format](interfaces/Format.md)                                   | A file format the document server knows.                                     |
| [GetForgottenCommand](interfaces/GetForgottenCommand.md)         | Asks for the URL a forgotten document can be downloaded from.                |
| [GetForgottenListCommand](interfaces/GetForgottenListCommand.md) | Lists the documents the editors left behind.                                 |
| [InfoCommand](interfaces/InfoCommand.md)                         | Asks who has the document open.                                              |
| [JwtOptions](interfaces/JwtOptions.md)                           | Settings of a signer, applied to every token it makes.                       |
| [License](interfaces/License.md)                                 | Terms of the license the document server runs under.                         |
| [LicenseCommand](interfaces/LicenseCommand.md)                   | Asks for the license and for the quota spent against it.                     |
| [LicenseQuota](interfaces/LicenseQuota.md)                       | Users counted against the license since the document server was started.     |
| [LicenseQuotaUser](interfaces/LicenseQuotaUser.md)               | A user counted against the license quota.                                    |
| [LicenseServer](interfaces/LicenseServer.md)                     | Build of the document server, and the verdict on its license.                |
| [MetaCommand](interfaces/MetaCommand.md)                         | Renames the document in every editor that has it open.                       |
| [PageMargins](interfaces/PageMargins.md)                         | Page margins, in CSS-like units such as `"17.8mm"`.                          |
| [PageSize](interfaces/PageSize.md)                               | Size of a page, in CSS-like units such as `"210mm"`.                         |
| [PdfOptions](interfaces/PdfOptions.md)                           | PDF output settings.                                                         |
| [RequestOptions](interfaces/RequestOptions.md)                   | Overrides applied to a single request, on top of the client options.         |
| [SignOptions](interfaces/SignOptions.md)                         | Overrides applied to a single token, on top of the signer options.           |
| [SpreadsheetLayout](interfaces/SpreadsheetLayout.md)             | Layout used when a spreadsheet is converted to PDF or to an image.           |
| [Thumbnail](interfaces/Thumbnail.md)                             | Settings for an image output format: BMP, GIF, JPG or PNG.                   |
| [VerifyOptions](interfaces/VerifyOptions.md)                     | Overrides applied to a single check, on top of the signer options.           |
| [VersionCommand](interfaces/VersionCommand.md)                   | Asks for the version of the document server.                                 |
| [Watermark](interfaces/Watermark.md)                             | Watermark stamped onto a PDF or image output.                                |
| [WatermarkParagraph](interfaces/WatermarkParagraph.md)           | A line of watermark text.                                                    |
| [WatermarkRun](interfaces/WatermarkRun.md)                       | A styled piece of watermark text.                                            |

## Type Aliases

| Type Alias                                                  | Description                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [AnyDocumentServerError](types/AnyDocumentServerError.md)   | Every error the SDK throws of its own accord.                                                                       |
| [BuilderArgument](types/BuilderArgument.md)                 | Values the builder script reads back through its `Argument` global.                                                 |
| [BuilderErrorCode](types/BuilderErrorCode.md)               | Why a build failed:                                                                                                 |
| [BuilderRequest](types/BuilderRequest.md)                   | Body of a request to the builder service.                                                                           |
| [CommandErrorCode](types/CommandErrorCode.md)               | Why a command failed:                                                                                               |
| [CommandRequest](types/CommandRequest.md)                   | Body of a request to the command service.                                                                           |
| [CommandType](types/CommandType.md)                         | Name of a command the service accepts.                                                                              |
| [ConversionErrorCode](types/ConversionErrorCode.md)         | Why a conversion failed:                                                                                            |
| [CsvDelimiter](types/CsvDelimiter.md)                       | Column separator for CSV input: none, tab, semicolon, colon, comma or space.                                        |
| [DocumentServerErrorKind](types/DocumentServerErrorKind.md) | Which failure an error stands for, and the discriminant of the union below.                                         |
| [FormatAction](types/FormatAction.md)                       | Something the editors can do with a format.                                                                         |
| [FormatType](types/FormatType.md)                           | Editor a format opens in, or the empty string for one that is only ever produced by a conversion, such as an image. |
| [JwtAlgorithm](types/JwtAlgorithm.md)                       | The HMAC algorithms the document server signs with.                                                                 |
| [JwtErrorKind](types/JwtErrorKind.md)                       | Why a token was refused, and the discriminant of [JwtError](classes/JwtError.md).                                   |
| [RgbColor](types/RgbColor.md)                               | Red, green and blue components, each 0–255.                                                                         |
| [TextAssociation](types/TextAssociation.md)                 | How a PDF, XPS or OXPS page is split into text blocks while it is read.                                             |
