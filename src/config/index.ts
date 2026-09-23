import type { DocumentServerFormats } from "../formats/index.js";
import type { DocumentServerJwt } from "../jwt/index.js";
import type {
  ConfigDocument,
  ConfigEditor,
  DocumentType,
  FileType,
  SignableConfig,
  StrictConfig,
} from "./types.js";

const MAX_KEY_LENGTH = 128;
const MAX_TITLE_LENGTH = 128;
const SUPPORTED_KEY = /^[0-9a-zA-Z._=-]+$/;
const DOCUMENT_TYPES: ReadonlySet<string> = new Set(["cell", "diagram", "pdf", "slide", "word"]);

/** A file the editors are to open, as your storage knows it. */
export interface ConfigFile {
  /** Identifier of this revision of the file. See {@link buildDocumentKey}. */
  key: string;
  /** Name of the file, extension included, which the editor shows and downloads it under. */
  title: string;
  /** Absolute URL the document server downloads the file from. */
  url: string;
}

function assertRecord(value: unknown, what: string): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(
      `${what} must be an object, got: ${value === null ? "null" : typeof value}`,
    );
  }
}

function normalizeUrl(url: unknown, what: string): string {
  if (typeof url !== "string") {
    throw new TypeError(`${what} must be a string, got: ${typeof url}`);
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new TypeError(`${what} must be an absolute URL, got: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError(`${what} must use http or https, got: ${parsed.protocol}`);
  }

  return url;
}

function normalizeKey(key: unknown): string {
  if (typeof key !== "string") {
    throw new TypeError(`document.key must be a string, got: ${typeof key}`);
  }

  if (key === "") {
    throw new TypeError("document.key must not be empty");
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new TypeError(
      `document.key must be at most ${String(MAX_KEY_LENGTH)} characters, got: ${String(key.length)}`,
    );
  }

  if (!SUPPORTED_KEY.test(key)) {
    throw new TypeError(`document.key must be made of 0-9, a-z, A-Z, -, ., _ and =, got: ${key}`);
  }

  return key;
}

function normalizeTitle(title: unknown): string {
  if (typeof title !== "string") {
    throw new TypeError(`document.title must be a string, got: ${typeof title}`);
  }

  if (title === "") {
    throw new TypeError("document.title must not be empty");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new TypeError(
      `document.title must be at most ${String(MAX_TITLE_LENGTH)} characters, got: ${String(title.length)}`,
    );
  }

  return title;
}

function normalizeFileType(fileType: unknown): FileType {
  if (typeof fileType !== "string") {
    throw new TypeError(`document.fileType must be a string, got: ${typeof fileType}`);
  }

  const trimmed = fileType.trim().toLowerCase();
  const dot = trimmed.lastIndexOf(".");
  const extension = dot === -1 ? trimmed : trimmed.slice(dot + 1);

  if (extension === "") {
    throw new TypeError(`document.fileType must name an extension, got: ${fileType}`);
  }

  return extension as FileType;
}

function normalizeDocumentType(documentType: unknown): DocumentType {
  if (typeof documentType !== "string" || !DOCUMENT_TYPES.has(documentType)) {
    throw new TypeError(
      `documentType must be one of ${[...DOCUMENT_TYPES].join(", ")}, got: ${String(documentType)}`,
    );
  }

  return documentType as DocumentType;
}

function normalizeDocument(document: unknown): ConfigDocument {
  assertRecord(document, "document");

  const source = document as ConfigDocument;
  const normalized: ConfigDocument = {
    ...source,
    key: normalizeKey(source.key),
    url: normalizeUrl(source.url, "document.url"),
  };

  if (source.fileType !== undefined) {
    normalized.fileType = normalizeFileType(source.fileType);
  }

  if (source.title !== undefined) {
    normalized.title = normalizeTitle(source.title);
  }

  return normalized;
}

function normalizeEditor(editorConfig: unknown): ConfigEditor {
  assertRecord(editorConfig, "editorConfig");

  const source = editorConfig as ConfigEditor;

  if (source.callbackUrl === undefined) {
    return { ...source };
  }

  return { ...source, callbackUrl: normalizeUrl(source.callbackUrl, "editorConfig.callbackUrl") };
}

function extensionOf(title: string): FileType {
  const dot = title.lastIndexOf(".");

  if (dot === -1) {
    throw new TypeError(`document.title must end in the extension of the file, got: ${title}`);
  }

  return normalizeFileType(title.slice(dot + 1));
}

/**
 * The config the editor is opened with: validated, normalized and signed with the secret
 * the document server is configured with.
 *
 * The editor takes its config in the browser, so the config travels as JSON — which is
 * why the `events` of the editor API are no part of it. Those are functions the browser
 * calls, and they are attached where the editor is constructed, on top of the config that
 * came from here.
 *
 * Every field is the one the editor API documents, from `@onlyoffice/doceditor-types`,
 * where nearly all of them are optional. This class requires what the document server
 * requires of them, and refuses what it silently rejects.
 */
export class DocumentServerConfig {
  /** The effective config: validated, with the values normalized, and frozen. */
  readonly config: Readonly<StrictConfig>;

  /**
   * @throws {TypeError} when `document` or `documentType` is missing, a URL is not
   * absolute, the key is too long or carries a character the server does not accept, or
   * the config carries the editor events.
   */
  constructor(config: SignableConfig) {
    assertRecord(config, "config");

    if ("events" in config) {
      throw new TypeError(
        "events must be no part of a config that is serialized and signed; attach them where the editor is constructed",
      );
    }

    const normalized: StrictConfig = {
      ...config,
      document: normalizeDocument(config.document),
      documentType: normalizeDocumentType(config.documentType),
    };

    if (config.editorConfig !== undefined) {
      normalized.editorConfig = normalizeEditor(config.editorConfig);
    }

    this.config = Object.freeze(normalized);
  }

  /**
   * A config for a file, with `fileType` read off its name and `documentType` looked up in
   * the formats the document server answered with.
   *
   * Anything else — the callback URL, the user, the permissions, the customization — is
   * laid over the derived config, and its `document` is merged into the derived one rather
   * than replacing it.
   *
   * @throws {TypeError} when the name carries no extension, or no editor opens it.
   */
  static forFile(
    file: ConfigFile,
    formats: DocumentServerFormats,
    config?: SignableConfig,
  ): DocumentServerConfig {
    const title = normalizeTitle(file.title);
    const fileType = extensionOf(title);
    const documentType = formats.getDocumentType(fileType);

    if (documentType === undefined || documentType === "") {
      throw new TypeError(`no editor opens ${fileType}`);
    }

    return new DocumentServerConfig({
      ...config,
      documentType: documentType as DocumentType,
      document: { ...file, title, fileType, ...config?.document },
    });
  }

  /**
   * The config with a `token` signed over it, which is what the editor is handed once the
   * document server has a secret.
   *
   * The token covers the whole config apart from itself, so a config that already carries
   * one is signed anew rather than signed over its own token.
   */
  async sign(jwt: DocumentServerJwt): Promise<Readonly<StrictConfig>> {
    const payload: StrictConfig = { ...this.config };

    delete payload.token;

    return Object.freeze({ ...payload, token: await jwt.sign(payload) });
  }

  /** The config itself, so that `JSON.stringify` of the instance writes it out. */
  toJSON(): Readonly<StrictConfig> {
    return this.config;
  }
}
