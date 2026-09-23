/**
 * Editor a format opens in, or the empty string for one that is only ever produced by a
 * conversion, such as an image.
 */
export type FormatType = "" | "cell" | "diagram" | "pdf" | "slide" | "word";

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
  | "view";

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
  return format.type !== "" || format.actions.length > 0;
}

/**
 * The formats of `/meta/formats`, indexed by extension: what each one opens in, what the
 * editors may do with it, what it converts to and what it is served as.
 *
 * The list changes with the version of the document server and with its licence, so it is
 * read from the server rather than carried here. One instance stands for one such answer;
 * get a fresh list to see a format the server has since learned.
 */
export class DocumentServerFormats {
  /** Every format of the list, in the order the server gave them, and frozen. */
  readonly all: readonly Format[];

  readonly #byExtension: ReadonlyMap<string, Format>;
  readonly #byMime: ReadonlyMap<string, readonly Format[]>;

  /**
   * @param formats The answer of {@link DocumentServerClient.getFormats}.
   *
   * @throws {TypeError} when it is not an array.
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

  /** How many extensions the list covers. */
  get size(): number {
    return this.#byExtension.size;
  }

  [Symbol.iterator](): IterableIterator<Format> {
    return this.all[Symbol.iterator]();
  }

  /**
   * The format an extension names, or `undefined` for one the server does not know.
   *
   * The extension is matched case-insensitively, with or without the leading dot, and a
   * whole file name is read down to the part behind its last dot.
   */
  getFormat(extension: string): Format | undefined {
    return this.#byExtension.get(normalize(extension));
  }

  /** Whether the server knows the extension at all. */
  hasFormat(extension: string): boolean {
    return this.#byExtension.has(normalize(extension));
  }

  /** Every extension the list covers, without the dots, in the order the server gave them. */
  getExtensions(): readonly string[] {
    return Object.freeze([...this.#byExtension.keys()]);
  }

  /**
   * The editor an extension opens in, which is the `documentType` the editor config takes.
   *
   * `undefined` both for an extension the server does not know and for one no editor
   * opens, such as an image or `zip` that a conversion only ever produces.
   */
  getDocumentType(extension: string): FormatType | undefined {
    const format = this.getFormat(extension);

    return format === undefined || format.type === "" ? undefined : format.type;
  }

  /** What the editors may do with an extension. Empty for one they never open. */
  getActions(extension: string): readonly FormatAction[] {
    return this.getFormat(extension)?.actions ?? NONE;
  }

  /** Whether the editors may do that with an extension. */
  can(extension: string, action: FormatAction): boolean {
    return this.getActions(extension).includes(action);
  }

  /** Whether an editor opens the extension at all, in whatever mode. */
  isOpenable(extension: string): boolean {
    const format = this.getFormat(extension);

    return format !== undefined && opens(format);
  }

  isViewable(extension: string): boolean {
    return this.can(extension, "view");
  }

  /** Whether the editors save it back in its own format, rather than only read it. */
  isEditable(extension: string): boolean {
    return this.can(extension, "edit");
  }

  /** Whether editing it loses what the format cannot carry, the way `rtf` and `odt` do. */
  isLossyEditable(extension: string): boolean {
    return this.can(extension, "lossy-edit");
  }

  /** Whether it is a form the editors fill in rather than edit. */
  isFillable(extension: string): boolean {
    return this.can(extension, "fill");
  }

  isCommentable(extension: string): boolean {
    return this.can(extension, "comment");
  }

  isReviewable(extension: string): boolean {
    return this.can(extension, "review");
  }

  /** Whether the editors convert it on the way in, the way they do the legacy `doc`. */
  isAutoConvertable(extension: string): boolean {
    return this.can(extension, "auto-convert");
  }

  /** Whether the editors open it behind a password. */
  isEncryptable(extension: string): boolean {
    return this.can(extension, "encrypt");
  }

  /**
   * The extensions an extension converts to, each without the dot, as the conversion API
   * takes them in `outputtype`. Empty for a format the server does not convert.
   */
  getConversions(extension: string): readonly string[] {
    return this.getFormat(extension)?.convert ?? NONE;
  }

  /** Whether the conversion API turns `from` into `to`. */
  isConvertibleTo(from: string, to: string): boolean {
    return this.getConversions(from).includes(normalize(to));
  }

  /** The MIME types an extension is served under. */
  getMimes(extension: string): readonly string[] {
    return this.getFormat(extension)?.mime ?? NONE;
  }

  /** The formats served under a MIME type, matched case-insensitively. */
  getFormatsByMime(mime: string): readonly Format[] {
    return this.#byMime.get(mime.trim().toLowerCase()) ?? NONE;
  }

  /** The formats one editor opens, or, for `""`, those a conversion only ever produces. */
  getFormatsByType(type: FormatType): readonly Format[] {
    return Object.freeze(this.all.filter((format) => format.type === type));
  }
}
