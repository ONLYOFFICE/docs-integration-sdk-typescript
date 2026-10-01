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

const NONE: readonly never[] = Object.freeze([]);

function normalize(extension: string): string {
  const trimmed = extension.trim().toLowerCase();
  const dot = trimmed.lastIndexOf(".");

  return dot === -1 ? trimmed : trimmed.slice(dot + 1);
}

function assertArray(formats: readonly Format[]): void {
  if (!Array.isArray(formats)) {
    throw new TypeError(`formats must be an array, got: ${typeof formats}`);
  }
}

function opens(format: Format): boolean {
  return format.type !== "";
}

/**
 * The formats of `/meta/formats`, indexed by extension: the editor each one opens in, what the
 * editors can do with it, what it converts to and its MIME types.
 *
 * Every method takes an extension with or without the dot, or a whole file name, and matches
 * it in any case: `"docx"`, `".DOCX"` and `"/files/Q3 Report.docx"` are the same lookup. An
 * extension the server doesn't know gives `undefined`, `false` or an empty list.
 *
 * The list depends on the version and the license of the document server. An instance holds
 * one answer and sends no requests, so it works as well with a list you cached. Fetch the list
 * again to see a format the server has learned since.
 *
 * @example
 * ```ts
 * const formats = new DocumentServerFormats(await client.getFormats());
 *
 * formats.getDocumentType("report.docx"); // "word"
 * formats.isEditable("docx"); // true
 * formats.isConvertibleTo("docx", "pdf"); // true
 * ```
 *
 * @see [Server configuration and formats](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/formats.md)
 */
export class DocumentServerFormats {
  /** Every format of the list, in the server's order, frozen. */
  readonly all: readonly Format[];

  readonly #byExtension: ReadonlyMap<string, Format>;
  readonly #byMime: ReadonlyMap<string, readonly Format[]>;

  /**
   * Indexes the list. When two formats share an extension, the one an editor opens wins over
   * one no editor opens; otherwise the first one wins.
   *
   * @param formats The answer of
   * {@link client!DocumentServerClient.getFormats | DocumentServerClient.getFormats()}.
   * @throws {TypeError} when `formats` is not an array.
   */
  constructor(formats: readonly Format[]) {
    assertArray(formats);

    const byExtension = new Map<string, Format>();
    const byMime = new Map<string, Format[]>();

    for (const format of formats) {
      const name = normalize(format.name);

      if (name !== "") {
        const known = byExtension.get(name);

        if (known === undefined || (!opens(known) && opens(format))) {
          byExtension.set(name, format);
        }
      }

      for (const mime of format.mime) {
        const type = mime.trim().toLowerCase();
        const shared = byMime.get(type);

        if (shared === undefined) {
          byMime.set(type, [format]);
        } else {
          shared.push(format);
        }
      }
    }

    for (const shared of byMime.values()) {
      Object.freeze(shared);
    }

    this.all = Object.freeze([...formats]);
    this.#byExtension = byExtension;
    this.#byMime = byMime;
  }

  /**
   * How many different extensions the list covers. Can be less than `all.length`, since two
   * formats may share an extension.
   */
  get size(): number {
    return this.#byExtension.size;
  }

  /** Iterates over {@link DocumentServerFormats.all}. */
  [Symbol.iterator](): IterableIterator<Format> {
    return this.all[Symbol.iterator]();
  }

  /**
   * Returns the format of an extension, or `undefined` when the server doesn't know it.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any
   * case.
   */
  getFormat(extension: string): Format | undefined {
    return this.#byExtension.get(normalize(extension));
  }

  /**
   * Returns whether the server knows the extension.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any
   * case.
   */
  hasFormat(extension: string): boolean {
    return this.#byExtension.has(normalize(extension));
  }

  /** Returns every extension the list covers, without the dot, in the server's order. */
  getExtensions(): readonly string[] {
    return Object.freeze([...this.#byExtension.keys()]);
  }

  /**
   * Returns the editor an extension opens in, which is `documentType` of the editor config.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any
   * case.
   * @returns The editor, or `undefined` both when the server doesn't know the extension and
   * when no editor opens it, such as an image or `zip`.
   */
  getDocumentType(extension: string): FormatType | undefined {
    const format = this.getFormat(extension);

    return format === undefined || format.type === "" ? undefined : format.type;
  }

  /**
   * Returns what the editors can do with an extension. Empty when no editor opens it.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  getActions(extension: string): readonly FormatAction[] {
    return this.getFormat(extension)?.actions ?? NONE;
  }

  /**
   * Returns whether the editors can do `action` with an extension.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   * @param action The action, such as `"edit"`.
   */
  can(extension: string, action: FormatAction): boolean {
    return this.getActions(extension).includes(action);
  }

  /**
   * Returns whether any editor opens the extension, in any mode: the format has a `type`.
   * Its actions are not checked.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isOpenable(extension: string): boolean {
    const format = this.getFormat(extension);

    return format !== undefined && opens(format);
  }

  /**
   * Returns whether the editors open the extension for viewing: action `"view"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isViewable(extension: string): boolean {
    return this.can(extension, "view");
  }

  /**
   * Returns whether the editors edit it and save it in its own format: action `"edit"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isEditable(extension: string): boolean {
    return this.can(extension, "edit");
  }

  /**
   * Returns whether editing it loses what the format can't store, like `rtf`: action
   * `"lossy-edit"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isLossyEditable(extension: string): boolean {
    return this.can(extension, "lossy-edit");
  }

  /**
   * Returns whether it is a form the editors fill in: action `"fill"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isFillable(extension: string): boolean {
    return this.can(extension, "fill");
  }

  /**
   * Returns whether the editors open it for commenting: action `"comment"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isCommentable(extension: string): boolean {
    return this.can(extension, "comment");
  }

  /**
   * Returns whether the editors open it for reviewing: action `"review"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isReviewable(extension: string): boolean {
    return this.can(extension, "review");
  }

  /**
   * Returns whether the editors convert it on open, like the legacy `doc`: action `"auto-convert"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isAutoConvertable(extension: string): boolean {
    return this.can(extension, "auto-convert");
  }

  /**
   * Returns whether the editors open it behind a password: action `"encrypt"`.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  isEncryptable(extension: string): boolean {
    return this.can(extension, "encrypt");
  }

  /**
   * Returns the extensions an extension converts to, without the dot, as `outputtype` of a
   * conversion takes them. Empty when the server doesn't convert it.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  getConversions(extension: string): readonly string[] {
    return this.getFormat(extension)?.convert ?? NONE;
  }

  /**
   * Returns whether the conversion API converts `from` into `to`. Both are matched like any
   * extension.
   *
   * @param from The extension or file name converted from.
   * @param to The extension converted to.
   */
  isConvertibleTo(from: string, to: string): boolean {
    return this.getConversions(from).includes(normalize(to));
  }

  /**
   * Returns the MIME types an extension is served under.
   *
   * @param extension An extension, with or without the dot, or a file name. Matched in any case.
   */
  getMimes(extension: string): readonly string[] {
    return this.getFormat(extension)?.mime ?? NONE;
  }

  /**
   * Returns the formats served under a MIME type, matched in any case.
   *
   * @param mime A MIME type, such as `"application/pdf"`.
   */
  getFormatsByMime(mime: string): readonly Format[] {
    return this.#byMime.get(mime.trim().toLowerCase()) ?? NONE;
  }

  /**
   * Returns the formats one editor opens, or, for `""`, those that only come out of a conversion.
   *
   * @param type The editor, such as `"word"`, or `""`.
   */
  getFormatsByType(type: FormatType): readonly Format[] {
    return Object.freeze(this.all.filter((format) => format.type === type));
  }
}
