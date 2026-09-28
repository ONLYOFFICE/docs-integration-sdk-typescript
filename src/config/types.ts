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
 * A config without the `events` section, which is what is serialized and signed.
 *
 * The events are functions the browser calls, so they neither survive `JSON.stringify`
 * nor belong in a token. They are attached to the config in the browser, where the editor
 * is constructed, rather than here.
 */
export type SignableConfig = Omit<Config, "events">;

/**
 * What your system grants on the file. `edit` is required: whether the file may be
 * changed is a decision of your system, not a default of the editor.
 */
export type ConfigInputPermissions = Omit<ConfigPermissions, "edit"> & { edit: boolean };

/**
 * The file as your storage knows it. `fileType` is read off `title` by
 * {@link DocumentServerConfig}, so the type leaves no room for it.
 */
export type ConfigInputDocument = Omit<
  ConfigDocument,
  "fileType" | "key" | "permissions" | "title" | "url"
> & {
  /** Identifier of this revision of the file. See {@link buildDocumentKey}. */
  key: string;
  /** Name of the file, extension included, which the editor shows and downloads it under. */
  title: string;
  /** Absolute URL the document server downloads the file from. */
  url: string;
  permissions: ConfigInputPermissions;
  fileType?: never;
};

/**
 * Everything your system knows of the editor it opens: the file, the permissions it grants
 * and the whole `editorConfig`. What the document server decides — `documentType`,
 * `document.fileType` — is derived by {@link DocumentServerConfig}, so the type leaves no
 * room for it, and neither for the `token`, which only {@link DocumentServerConfig.sign}
 * writes.
 */
export type ConfigInput = Omit<SignableConfig, "document" | "documentType" | "token"> & {
  document: ConfigInputDocument;
  documentType?: never;
  token?: never;
  events?: never;
};

/**
 * A config carrying what the document server requires of it, which is what
 * {@link DocumentServerConfig} builds out of a {@link ConfigInput}.
 */
export interface StrictConfig extends SignableConfig {
  document: ConfigDocument;
  documentType: DocumentType;
}
