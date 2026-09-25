/** Where the document server expects the JWT of a request. */
export interface ConfigAuthorization {
  /** Name of the header carrying the token, such as `"Authorization"`. */
  header: string;
  /** Prefix the token is written behind, such as `"Bearer "`. */
  prefix: string;
}

/** Paths of the endpoints the document server serves, relative to its base URL. */
export interface ConfigUrls {
  /** Script that loads the editor API, such as `"/web-apps/apps/api/documents/api.js"`. */
  api: string;
  command: string;
  converter: string;
  /**
   * The conversion of a document sent along with the request, `"/converter/from-file"`.
   * Absent on a document server that has none.
   */
  converterFromFile?: string;
  docbuilder: string;
  /**
   * The builder of a script sent along with the request, `"/docbuilder/from-file"`.
   * Absent on a document server that has none.
   */
  docbuilderFromFile?: string;
}

/** Bounds the document server enforces. */
export interface ConfigLimits {
  /** Largest file it accepts, in bytes. */
  maxFileSize: number;
}

/** Body of a response from the configuration endpoint. */
export interface ConfigResponse {
  authorization: ConfigAuthorization;
  /** Language tags the editor interface is translated into, such as `"pt-PT"`. */
  langs: string[];
  limits: ConfigLimits;
  urls: ConfigUrls;
}

/**
 * Editor a format opens in, or the empty string for one that is only ever produced by a
 * conversion, such as an image.
 */
export type FormatType = "" | "cell" | "diagram" | "pdf" | "slide" | "word" | (string & {});

/** Something the editors can do with a format. */
export type FormatAction =
  | "auto-convert"
  | "comment"
  | "customfilter"
  | "edit"
  | "encrypt"
  | "fill"
  | "lossy-edit"
  | "review"
  | "view"
  | (string & {});

/** A file format the document server knows. */
export interface Format {
  /** What the editors can do with it. Empty for a format they never open. */
  actions: FormatAction[];
  /** Extensions it can be converted to, each without the dot. */
  convert: string[];
  /** MIME types it is served under. */
  mime: string[];
  /** Extension of the format, without the dot, such as `"docx"`. */
  name: string;
  type: FormatType;
}

/** Body of a response from the formats endpoint: every format the document server knows. */
export type FormatsResponse = Format[];
