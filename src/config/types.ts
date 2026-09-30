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

import type { Config, DocumentType, FileType } from "@onlyoffice/doceditor-types";

export type { Config, DocumentType, FileType };

/** The `document` section of a config. */
export type ConfigDocument = NonNullable<Config["document"]>;

/** The `document.permissions` section of a config. */
export type ConfigPermissions = NonNullable<ConfigDocument["permissions"]>;

/** The `editorConfig` section of a config. */
export type ConfigEditor = NonNullable<Config["editorConfig"]>;

/**
 * A config without `events`: what is serialized and signed. Events are functions, so they
 * don't survive `JSON.stringify` and can't be signed. Add them in the browser, where the editor
 * is created.
 */
export type SignableConfig = Omit<Config, "events">;

/**
 * The permissions your system grants on the file. `edit` is required: the SDK has no default
 * for whether a file may be changed.
 */
export type ConfigInputPermissions = Omit<ConfigPermissions, "edit"> & { edit: boolean };

/**
 * The file as your storage knows it. {@link DocumentServerConfig} derives `fileType` from
 * `title`, so it can't be given.
 */
export type ConfigInputDocument = Omit<
  ConfigDocument,
  "fileType" | "key" | "permissions" | "title" | "url"
> & {
  /** Identifies this revision of the file. Build it with {@link buildDocumentKey}. */
  key: string;
  /** Name of the file, extension included, which the editor shows and downloads it under. */
  title: string;
  /** Absolute URL the document server downloads the file from. */
  url: string;
  /** What the user may do with the file. `edit` is required. */
  permissions: ConfigInputPermissions;
  /** Derived from `title`, so it can't be given. */
  fileType?: never;
};

/**
 * The input of {@link DocumentServerConfig}: the file, the permissions on it and the whole
 * `editorConfig`.
 *
 * Four fields can't be given: `documentType` and `document.fileType` are derived from the
 * format, {@link DocumentServerConfig.sign} writes `token`, and `events` are added in the
 * browser.
 */
export type ConfigInput = Omit<SignableConfig, "document" | "documentType" | "token"> & {
  /** The file, as your storage knows it, and the permissions on it. */
  document: ConfigInputDocument;
  /** Derived from the format of the file, so it can't be given. */
  documentType?: never;
  /** Written by {@link DocumentServerConfig.sign}, so it can't be given. */
  token?: never;
  /** Functions, added in the browser where the editor is created, so they can't be given. */
  events?: never;
};

/**
 * The config {@link DocumentServerConfig} builds from a {@link ConfigInput}, with `document`
 * and `documentType` always set.
 */
export interface StrictConfig extends SignableConfig {
  /** The file, with `fileType` derived from `title`. */
  document: ConfigDocument;
  /** The editor the file opens in, derived from its format, such as `"word"`. */
  documentType: DocumentType;
}
