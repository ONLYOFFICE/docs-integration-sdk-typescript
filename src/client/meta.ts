/**
 *
 * (c) Copyright Ascensio System SIA 2026
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
  /** The command service, `"/command"`. */
  command: string;
  /** The conversion service, `"/converter"`. */
  converter: string;
  /**
   * The conversion of a document sent along with the request, `"/converter/from-file"`.
   * Absent on a document server that has none.
   */
  converterFromFile?: string;
  /** The document builder service, `"/docbuilder"`. */
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

/** The body of a response from `/meta/config`. */
export interface ConfigResponse {
  /**
   * Where the server expects a token. Set `authorizationHeader` and `authorizationPrefix` of
   * the client to it.
   */
  authorization: ConfigAuthorization;
  /** Language tags the editor interface is translated into, such as `"pt-PT"`. */
  langs: string[];
  /** The bounds the server enforces. */
  limits: ConfigLimits;
  /** The paths of its endpoints. */
  urls: ConfigUrls;
}

/**
 * The editor a format opens in, which is `documentType` of the editor config. Empty for a
 * format that only comes out of a conversion, such as an image.
 */
export type FormatType = "" | "cell" | "diagram" | "pdf" | "slide" | "word" | (string & {});

/**
 * Something the editors can do with a format:
 *
 * - `"view"`, `"edit"`, `"comment"`, `"review"`: open it in that mode;
 * - `"lossy-edit"`: edit it, losing what the format can't store;
 * - `"fill"`: fill in a form;
 * - `"customfilter"`: what the `modifyFilter` permission of the editor config needs;
 * - `"auto-convert"`: convert it on open, like the legacy `doc`;
 * - `"encrypt"`: open it behind a password.
 *
 * A newer document server may name an action this SDK doesn't know.
 */
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
  /** The editor it opens in, which is `documentType` of the editor config. Empty when none does. */
  type: FormatType;
}

/** The body of a response from `/meta/formats`: every format the document server knows. */
export type FormatsResponse = Format[];
