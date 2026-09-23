export { DocumentServerClient } from "./client/index.js";
export { DocumentServerRawClient } from "./client/raw.js";
export { DocumentServerConfig } from "./config/index.js";
export { buildDocumentKey } from "./config/key.js";
export { DocumentServerFormats } from "./formats/index.js";
export { DocumentServerJwt } from "./jwt/index.js";
export { JwtError } from "./jwt/errors.js";
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
  FormatsResponse,
} from "./client/meta.js";
export type { ConfigFile } from "./config/index.js";
export type { Format, FormatAction, FormatType } from "./formats/index.js";
export type {
  Config,
  ConfigDocument,
  ConfigEditor,
  DocumentType,
  FileType,
  SignableConfig,
  StrictConfig,
} from "./config/types.js";
export type { JwtAlgorithm, JwtOptions, SignOptions, VerifyOptions } from "./jwt/index.js";
export type { JwtErrorKind } from "./jwt/errors.js";
