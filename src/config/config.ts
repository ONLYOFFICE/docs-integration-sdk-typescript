import { ConfigError } from "./errors.js";
import type { ConfigInput, FileType, StrictConfig } from "./types.js";

const MAX_KEY_LENGTH = 128;
const MAX_USER_ID_LENGTH = 128;
const SUPPORTED_KEY = /^[0-9a-zA-Z._=-]+$/;

/**
 * The permissions a format has to allow, each with the actions of `/meta/formats` that
 * allow it. A permission the format does not allow is lowered to `false`.
 */
const PERMISSION_ACTIONS = {
  comment: ["comment"],
  edit: ["edit", "lossy-edit"],
  fillForms: ["fill"],
  modifyFilter: ["customfilter"],
  review: ["review"],
} as const satisfies Record<string, readonly string[]>;

type FormatPermission = keyof typeof PERMISSION_ACTIONS;

/**
 * The permissions that let the user change the document — its text, the tracked changes,
 * the comments, the fields of a form — whose changes the document server then posts to
 * `callbackUrl`.
 */
const CHANGING_PERMISSIONS: readonly FormatPermission[] = [
  "edit",
  "review",
  "comment",
  "fillForms",
];

/** Fields of `editorConfig` that take an absolute URL. */
const EDITOR_URLS = ["createUrl", "mergeFolderUrl", "saveAsUrl", "sharingSettingsUrl"] as const;

/** Fields of `editorConfig.embedded` that take an absolute URL. */
const EMBEDDED_URLS = ["embedUrl", "fullscreenUrl", "saveUrl", "shareUrl"] as const;

type Mutable = Record<string, unknown>;

/**
 * What the config takes of a format: the part of a {@link formats!Format | Format} of
 * `/meta/formats` it is built out of.
 */
export interface ConfigFormat {
  /** What the editors can do with it. */
  readonly actions: readonly string[];
  /** Editor it opens in, which becomes `documentType`, or the empty string for none. */
  readonly type: string;
}

/**
 * What finds the format of a file:
 * {@link formats!DocumentServerFormats | DocumentServerFormats} or a lookup of your own.
 */
export interface FormatLookup {
  /** The format an extension names, or `undefined` for one the server does not know. */
  getFormat(extension: string): ConfigFormat | undefined;
}

/**
 * What signs a config: {@link jwt!DocumentServerJwt | DocumentServerJwt} or any signer of your
 * own.
 */
export interface ConfigSigner {
  /** Signs the payload into a token. */
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

/** The extension `title` ends in, in lower case, which is the `fileType` of the document. */
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

/** Lowers every permission the format does not allow to `false`. */
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

/**
 * Keeps `callbackUrl` only where the document server posts to it: in `edit` mode, for a user
 * who may change the document. Anywhere else it is cut, `forcesave` along with it.
 */
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

    // An empty or null url makes the logo not clickable.
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
 * The config the editor is opened with, built out of what your system knows of the file
 * and the formats of the document server: validated, completed and signed with the secret
 * the document server is configured with.
 *
 * What your system knows goes in — the file, the permissions it grants, the whole
 * `editorConfig`. What the document server decides is derived, over whatever was given:
 *
 * - `document.fileType` is the extension `title` ends in;
 * - `documentType` is the editor the server opens that format in;
 * - a permission the format does not allow — `edit`, `review`, `comment`, `fillForms`,
 *   `modifyFilter` — is lowered to `false`;
 * - `callbackUrl` is kept only in `edit` mode for a user who may change the document, and
 *   required there; anywhere else it is cut, `customization.forcesave` along with it.
 *
 * `mode` is left as it was given. The editor takes its config in the browser, so the
 * config travels as JSON — which is why the `events` of the editor API are no part of it.
 */
export class DocumentServerConfig {
  /** The effective config: validated, completed, and frozen through and through. */
  readonly config: Readonly<StrictConfig>;

  /**
   * @param input What your system knows of the editor it opens.
   * @param formats The formats of the document server, or a lookup of your own.
   *
   * @throws {@link ConfigError} `unsupported` when no editor of the server opens the format
   * of the file, and `invalid` when a field is missing or would be rejected by the server.
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
   * The config with a `token` signed over it, which is what the editor is handed once the
   * document server has a secret.
   *
   * The token covers the whole config apart from itself, so a config that already carries
   * one is signed anew rather than signed over its own token.
   */
  async sign(signer: ConfigSigner): Promise<Readonly<StrictConfig>> {
    const payload: StrictConfig = { ...this.config };

    delete payload.token;

    return Object.freeze({ ...payload, token: await signer.sign(payload) });
  }

  /** The config itself, so that `JSON.stringify` of the instance writes it out. */
  toJSON(): Readonly<StrictConfig> {
    return this.config;
  }
}
