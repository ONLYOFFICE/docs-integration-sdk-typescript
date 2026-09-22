export { DocumentServerClient } from "./client/index.js";
export { DocumentServerRawClient } from "./client/raw.js";
export {
  BuilderError,
  CommandError,
  ConversionError,
  DocumentServerError,
  DocumentServerHttpError,
  DocumentServerParseError,
} from "./client/errors.js";
export type { AnyDocumentServerError, DocumentServerErrorKind } from "./client/errors.js";
export type { ClientOptions, RequestOptions } from "./client/options.js";
export type {
  BuilderArgument,
  BuilderErrorCode,
  BuilderRequest,
  BuilderResponse,
  BuildRequest,
  BuildResultRequest,
} from "./client/builder.js";
export type {
  CommandErrorCode,
  CommandRequest,
  CommandResponse,
  CommandType,
  DeleteForgottenCommand,
  DocumentMeta,
  DropCommand,
  ForcesaveCommand,
  GetForgottenCommand,
  GetForgottenListCommand,
  InfoCommand,
  License,
  LicenseCommand,
  LicenseQuota,
  LicenseQuotaUser,
  LicenseServer,
  MetaCommand,
  VersionCommand,
} from "./client/command.js";
export type {
  ConversionErrorCode,
  ConvertRequest,
  ConvertResponse,
  CsvDelimiter,
  DocumentLayout,
  DocumentRenderer,
  PageMargins,
  PageSize,
  PdfOptions,
  RgbColor,
  SpreadsheetLayout,
  TextAssociation,
  Thumbnail,
  Watermark,
  WatermarkParagraph,
  WatermarkRun,
} from "./client/convert.js";
export type {
  ConfigAuthorization,
  ConfigLimits,
  ConfigResponse,
  ConfigUrls,
  Format,
  FormatAction,
  FormatType,
} from "./client/meta.js";
