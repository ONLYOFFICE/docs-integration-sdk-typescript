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

import { ConfigError } from "./errors.js";
import type { ConfigInput, FileType, StrictConfig } from "./types.js";

const MAX_KEY_LENGTH = 128;
const MAX_USER_ID_LENGTH = 128;
const SUPPORTED_KEY = /^[0-9a-zA-Z._=-]+$/;

const PERMISSION_ACTIONS = {
  comment: ["comment"],
  edit: ["edit", "lossy-edit"],
  fillForms: ["fill"],
  modifyFilter: ["customfilter"],
  review: ["review"],
} as const satisfies Record<string, readonly string[]>;

type FormatPermission = keyof typeof PERMISSION_ACTIONS;

const CHANGING_PERMISSIONS: readonly FormatPermission[] = [
  "edit",
  "review",
  "comment",
  "fillForms",
];

const EDITOR_URLS = ["createUrl", "mergeFolderUrl", "saveAsUrl", "sharingSettingsUrl"] as const;

const EMBEDDED_URLS = ["embedUrl", "fullscreenUrl", "saveUrl", "shareUrl"] as const;

type Mutable = Record<string, unknown>;

/** The part of a {@link formats!Format | Format} the config is built from. */
export interface ConfigFormat {
  /** What the editors can do with the format, as `/meta/formats` names it: `edit`, `fill` and so on. */
  readonly actions: readonly string[];
  /** The editor the format opens in, which becomes `documentType`. Empty when no editor opens it. */
  readonly type: string;
}

/**
 * Finds the format of a file. {@link formats!DocumentServerFormats | DocumentServerFormats}
 * implements it; any object with `getFormat()` works.
 */
export interface FormatLookup {
  /**
   * Returns the format of an extension, or `undefined` when the document server doesn't know it.
   *
   * @param extension The extension, in lower case and without the dot, such as `"docx"`.
   */
  getFormat(extension: string): ConfigFormat | undefined;
}

/**
 * Signs a config. {@link jwt!DocumentServerJwt | DocumentServerJwt} implements it; any object
 * with `sign()` works, such as a signer backed by a key vault.
 */
export interface ConfigSigner {
  /** Signs the payload and resolves to the token. */
  sign(payload: object): Promise<string>;
}

function invalid(field: string, message: string): ConfigError {
  return new ConfigError("invalid", field, `${field} ${message}`);
}

function isRecord(value: unknown): value is Mutable {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, field: string): asserts value is Mutable {
  if (!isRecord(value)) {
    throw invalid(
      field,
      `must be an object, got: ${value === null ? "null" : Array.isArray(value) ? "array" : typeof value}`,
    );
  }
}

function clone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch (error) {
    throw new ConfigError("invalid", "config", "config must be made of plain data", {
      cause: error,
    });
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }

    Object.freeze(value);
  }

  return value;
}

function checkUrl(url: unknown, field: string): void {
  if (typeof url !== "string") {
    throw invalid(field, `must be a string, got: ${typeof url}`);
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw invalid(field, `must be an absolute URL, got: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw invalid(field, `must use http or https, got: ${parsed.protocol}`);
  }
}

function checkOptionalUrl(record: Mutable, key: string, field: string): void {
  if (record[key] !== undefined) {
    checkUrl(record[key], field);
  }
}

function checkString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw invalid(field, `must be a string, got: ${typeof value}`);
  }

  if (value === "") {
    throw invalid(field, "must not be empty");
  }

  if (value.length > maxLength) {
    throw invalid(
      field,
      `must be at most ${String(maxLength)} characters, got: ${String(value.length)}`,
    );
  }

  return value;
}

function checkKey(key: unknown): void {
  const checked = checkString(key, "document.key", MAX_KEY_LENGTH);

  if (!SUPPORTED_KEY.test(checked)) {
    throw invalid("document.key", `must be made of 0-9, a-z, A-Z, -, ., _ and =, got: ${checked}`);
  }
}

function fileTypeOf(title: unknown): FileType {
  if (typeof title !== "string") {
    throw invalid("document.title", `must be a string, got: ${typeof title}`);
  }

  const dot = title.lastIndexOf(".");
  const extension =
    dot === -1
      ? ""
      : title
          .slice(dot + 1)
          .trim()
          .toLowerCase();

  if (extension === "") {
    throw invalid("document.title", `must end in the extension of the file, got: ${title}`);
  }

  return extension as FileType;
}

function fitPermissions(permissions: Mutable, format: ConfigFormat): void {
  if (typeof permissions["edit"] !== "boolean") {
    throw invalid(
      "document.permissions.edit",
      `must be a boolean, got: ${typeof permissions["edit"]}`,
    );
  }

  for (const [permission, actions] of Object.entries(PERMISSION_ACTIONS)) {
    const value = permissions[permission];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "boolean") {
      throw invalid(
        `document.permissions.${permission}`,
        `must be a boolean, got: ${typeof value}`,
      );
    }

    if (value && !actions.some((action) => format.actions.includes(action))) {
      permissions[permission] = false;
    }
  }
}

function fitCallback(editor: Mutable, permissions: Mutable): void {
  const mode = editor["mode"] ?? "edit";

  if (mode !== "edit" && mode !== "view") {
    throw invalid("editorConfig.mode", `must be "edit" or "view", got: ${JSON.stringify(mode)}`);
  }

  const changes = mode === "edit" && CHANGING_PERMISSIONS.some((key) => permissions[key] === true);

  if (!changes) {
    delete editor["callbackUrl"];

    if (isRecord(editor["customization"])) {
      delete editor["customization"]["forcesave"];
    }

    return;
  }

  if (editor["callbackUrl"] === undefined) {
    throw invalid(
      "editorConfig.callbackUrl",
      "is required when the user may change the document in edit mode: the changes are saved through it",
    );
  }

  checkUrl(editor["callbackUrl"], "editorConfig.callbackUrl");
}

function checkUser(editor: Mutable): void {
  if (editor["user"] === undefined) {
    return;
  }

  assertRecord(editor["user"], "editorConfig.user");
  checkString(editor["user"]["id"], "editorConfig.user.id", MAX_USER_ID_LENGTH);
}

function checkEditorUrls(editor: Mutable): void {
  for (const key of EDITOR_URLS) {
    checkOptionalUrl(editor, key, `editorConfig.${key}`);
  }

  for (const list of ["recent", "templates"] as const) {
    const items = editor[list];

    if (Array.isArray(items)) {
      items.forEach((item: unknown, index) => {
        if (isRecord(item)) {
          checkOptionalUrl(item, "url", `editorConfig.${list}[${String(index)}].url`);
        }
      });
    }
  }

  const customization = editor["customization"];

  if (isRecord(customization)) {
    for (const section of ["feedback", "goback"] as const) {
      const value = customization[section];

      if (isRecord(value)) {
        checkOptionalUrl(value, "url", `editorConfig.customization.${section}.url`);
      }
    }

    const logo = customization["logo"];

    if (isRecord(logo) && logo["url"] !== "" && logo["url"] !== null) {
      checkOptionalUrl(logo, "url", "editorConfig.customization.logo.url");
    }
  }

  const embedded = editor["embedded"];

  if (isRecord(embedded)) {
    for (const key of EMBEDDED_URLS) {
      checkOptionalUrl(embedded, key, `editorConfig.embedded.${key}`);
    }
  }
}

/**
 * The config an editor is opened with. Build it on your server, where the JWT secret is, and
 * pass the result to `DocsAPI.DocEditor` in the browser.
 *
 * The constructor validates the input and completes it from the format of the file:
 *
 * - `document.fileType` is set to the extension of `title`, in lower case;
 * - `documentType` is set to the editor that opens the format;
 * - a permission the format doesn't allow is set to `false`: `edit` needs the action `edit` or
 *   `lossy-edit`, `review` needs `review`, `comment` needs `comment`, `fillForms` needs `fill`,
 *   `modifyFilter` needs `customfilter`. Other permissions are kept as given;
 * - `editorConfig.callbackUrl` is kept only in `edit` mode, the default, for a user who can
 *   change the document: one whose `edit`, `review`, `comment` or `fillForms` is `true` after
 *   the step above. There it is required. Otherwise it is removed, and
 *   `editorConfig.customization.forcesave` with it.
 *
 * `editorConfig.mode` is kept as given. The config has no `events`: they are functions, so add
 * them in the browser.
 *
 * @example
 * ```ts
 * const config = new DocumentServerConfig(
 *   {
 *     document: {
 *       key: await buildDocumentKey(file.id, file.version),
 *       title: "Report.docx",
 *       url: "https://storage.example.com/report.docx",
 *       permissions: { edit: true },
 *     },
 *     editorConfig: {
 *       callbackUrl: "https://app.example.com/callback?fileId=17",
 *       user: { id: "u-17", name: "Anna Schmidt" },
 *     },
 *   },
 *   formats,
 * );
 *
 * const signed = await config.sign(jwt);
 * ```
 *
 * @see [Opening an editor](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/editor.md)
 */
export class DocumentServerConfig {
  /** The config the constructor built: validated, completed and deeply frozen. */
  readonly config: Readonly<StrictConfig>;

  /**
   * Validates the input and builds the config. The input is copied, so later changes to it have
   * no effect.
   *
   * @param input The file, the permissions on it and the whole `editorConfig`.
   * @param formats The formats of the document server:
   * {@link "formats"!DocumentServerFormats | DocumentServerFormats} or any {@link FormatLookup}.
   *
   * @throws {@link ConfigError} of kind `"unsupported"`, with `field` `"document.title"`, when
   * the document server doesn't know the format of the file or opens it in no editor, such as
   * `png`.
   *
   * @throws {@link ConfigError} of kind `"invalid"`, with `field` naming the path, when:
   *
   * - the input can't be copied with `structuredClone`, such as one holding a function
   *   (`field` is `"config"`);
   * - the input, `document`, `document.permissions`, `editorConfig` or `editorConfig.user` is
   *   not an object;
   * - `document.key` is not a string, is empty, is longer than 128 characters, or has
   *   characters other than `0-9`, `a-z`, `A-Z`, `-`, `.`, `_` and `=`;
   * - `document.title` is not a string or has no extension;
   * - `document.permissions.edit` is not a boolean, or `comment`, `fillForms`, `modifyFilter`
   *   or `review` is given and is not a boolean;
   * - `editorConfig.mode` is given and is neither `"edit"` nor `"view"`;
   * - `editorConfig.callbackUrl` is missing where it is kept;
   * - `editorConfig.user.id` is not a string, is empty or is longer than 128 characters;
   * - a URL is not a string holding an absolute `http` or `https` URL. Checked are
   *   `document.url` and the kept `editorConfig.callbackUrl`, and, when given, `createUrl`,
   *   `mergeFolderUrl`, `saveAsUrl`, `sharingSettingsUrl`, the `url` of each item of `recent`
   *   and `templates`, `customization.feedback.url`, `customization.goback.url`,
   *   `customization.logo.url`, and `embedUrl`, `fullscreenUrl`, `saveUrl` and `shareUrl` of
   *   `embedded`. An empty or `null` `customization.logo.url` is allowed: it makes the logo
   *   not clickable.
   */
  constructor(input: ConfigInput, formats: FormatLookup) {
    assertRecord(input, "config");

    const config = clone(input as Mutable);
    const document = config["document"];

    assertRecord(document, "document");
    checkKey(document["key"]);
    checkUrl(document["url"], "document.url");

    const fileType = fileTypeOf(document["title"]);
    const format = formats.getFormat(fileType);

    if (format === undefined || format.type === "") {
      throw new ConfigError(
        "unsupported",
        "document.title",
        `no editor of the document server opens ${fileType}`,
      );
    }

    const permissions = document["permissions"];

    assertRecord(permissions, "document.permissions");
    fitPermissions(permissions, format);

    const editor = config["editorConfig"] ?? {};

    assertRecord(editor, "editorConfig");
    fitCallback(editor, permissions);
    checkUser(editor);
    checkEditorUrls(editor);

    document["fileType"] = fileType;
    config["documentType"] = format.type;

    this.config = deepFreeze(config as unknown as StrictConfig);
  }

  /**
   * Returns a copy of the config with a `token` field. The editor needs it once the document
   * server has a JWT secret.
   *
   * The token covers the whole config except `token`, so a config that already has a token is
   * signed again from scratch.
   *
   * @param signer {@link jwt!DocumentServerJwt | DocumentServerJwt} or any {@link ConfigSigner}.
   * @returns The signed config, frozen.
   * @see [Opening a file](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/browser/#opening-file)
   */
  async sign(signer: ConfigSigner): Promise<Readonly<StrictConfig>> {
    const payload: StrictConfig = { ...this.config };

    delete payload.token;

    return Object.freeze({ ...payload, token: await signer.sign(payload) });
  }

  /** Returns {@link DocumentServerConfig.config}, so `JSON.stringify(instance)` writes the config. */
  toJSON(): Readonly<StrictConfig> {
    return this.config;
  }
}
