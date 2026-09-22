import type { Config, DocumentType, FileType } from "@onlyoffice/doceditor-types";

export type { Config, DocumentType, FileType };

/** The `document` section of a config. */
export type ConfigDocument = NonNullable<Config["document"]>;

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
 * A config carrying what the document server requires of it, which is what
 * {@link DocumentServerConfig} validates a loose one into.
 */
export interface StrictConfig extends SignableConfig {
  document: ConfigDocument;
  documentType: DocumentType;
}
