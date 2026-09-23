import type { BuilderErrorCode } from "./builder.js";
import type { CommandErrorCode } from "./command.js";
import type { ConversionErrorCode } from "./convert.js";

const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.error");

const CONVERSION_MESSAGES: Readonly<Record<number, string>> = {
  [-1]: "unknown error",
  [-2]: "conversion timeout",
  [-3]: "conversion error",
  [-4]: "error while downloading the source document",
  [-5]: "incorrect password",
  [-6]: "error while accessing the conversion result database",
  [-7]: "input error",
  [-8]: "invalid token",
  [-9]: "the output format is ambiguous and has to be named explicitly",
  [-10]: "size limit exceeded",
};

const COMMAND_MESSAGES: Readonly<Record<number, string>> = {
  1: "the document key is missing or too long",
  2: "the callback url is incorrect",
  3: "internal server error",
  4: "nothing had changed since the last save",
  5: "the command is unknown",
  6: "invalid token",
};

const BUILDER_MESSAGES: Readonly<Record<number, string>> = {
  [-1]: "unknown error",
  [-2]: "generation timeout",
  [-3]: "generation error",
  [-4]: "error while downloading the script or a file it opens",
  [-6]: "error while accessing the generation result database",
  [-8]: "invalid token",
};

function describe(messages: Readonly<Record<number, string>>, code: number): string {
  return messages[code] ?? "unrecognized error code";
}

/** Which failure an error stands for, and the discriminant of the union below. */
export type DocumentServerErrorKind =
  "builder" | "command" | "conversion" | "http" | "network" | "parse" | "timeout";

/** Every error the SDK throws of its own accord. */
export type AnyDocumentServerError =
  | BuilderError
  | CommandError
  | ConversionError
  | DocumentServerHttpError
  | DocumentServerNetworkError
  | DocumentServerParseError
  | DocumentServerTimeoutError;

/**
 * Every failure of a call to the document server that the SDK turns into a rejection: a
 * failure the server reports, an answer that is not the one promised, or no answer at all.
 */
export class DocumentServerError extends Error {
  readonly kind: DocumentServerErrorKind;

  /**
   * The response the error was read from. Its body has already been consumed. Absent from
   * a network failure and a timeout, which may have come before any response did.
   */
  readonly response: Response | undefined;

  /**
   * Where the request went, the query left out: a download link carries its signature
   * there. Read off the response when there is one, redirects followed. Empty when it is
   * not known, as from a `fetch` of your own that answers with a `Response` built by hand.
   */
  readonly url: string;

  constructor(
    kind: DocumentServerErrorKind,
    message: string,
    response: Response | undefined,
    options?: ErrorOptions & { url?: string },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "DocumentServerError";
    this.kind = kind;
    this.response = response;
    this.url = location(options?.url ?? response?.url ?? "");
  }

  /** @internal */
  get [BRAND](): true {
    return true;
  }

  /** Recognizes an error of this SDK, a second copy of the package included. */
  static is(value: unknown): value is AnyDocumentServerError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}

/** The document server answered with a status outside the 2xx range. */
export class DocumentServerHttpError extends DocumentServerError {
  declare readonly kind: "http";
  declare readonly response: Response;
  readonly status: number;
  /** Beginning of the response body, as far as it could be read. */
  readonly body: string;

  constructor(response: Response, body: string) {
    const status = `${String(response.status)} ${response.statusText}`.trim();

    super(
      "http",
      `the document server answered ${status}${at(location(response.url))}${body === "" ? "" : `: ${body}`}`,
      response,
    );
    this.name = "DocumentServerHttpError";
    this.status = response.status;
    this.body = body;
  }

  static override is(value: unknown): value is DocumentServerHttpError {
    return DocumentServerError.is(value) && value.kind === "http";
  }
}

/** The body of a successful response was not the JSON the endpoint promises. */
export class DocumentServerParseError extends DocumentServerError {
  declare readonly kind: "parse";
  declare readonly response: Response;
  /** Beginning of the response body, as far as it could be read. */
  readonly body: string;

  constructor(message: string, response: Response, body: string, options?: ErrorOptions) {
    super("parse", message, response, options);
    this.name = "DocumentServerParseError";
    this.body = body;
  }

  static override is(value: unknown): value is DocumentServerParseError {
    return DocumentServerError.is(value) && value.kind === "parse";
  }
}

/** The conversion service reported a failure in a body it answered `200 OK` with. */
export class ConversionError extends DocumentServerError {
  declare readonly kind: "conversion";
  declare readonly response: Response;
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode, response: Response) {
    super(
      "conversion",
      `conversion failed with code ${String(code)}: ${describe(CONVERSION_MESSAGES, code)}`,
      response,
    );
    this.name = "ConversionError";
    this.code = code;
  }

  static override is(value: unknown): value is ConversionError {
    return DocumentServerError.is(value) && value.kind === "conversion";
  }
}

/** The command service reported a failure in a body it answered `200 OK` with. */
export class CommandError extends DocumentServerError {
  declare readonly kind: "command";
  declare readonly response: Response;
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, response: Response) {
    super(
      "command",
      `command failed with code ${String(code)}: ${describe(COMMAND_MESSAGES, code)}`,
      response,
    );
    this.name = "CommandError";
    this.code = code;
  }

  static override is(value: unknown): value is CommandError {
    return DocumentServerError.is(value) && value.kind === "command";
  }
}

/** The builder service reported a failure in a body it answered `200 OK` with. */
export class BuilderError extends DocumentServerError {
  declare readonly kind: "builder";
  declare readonly response: Response;
  readonly code: BuilderErrorCode;

  constructor(code: BuilderErrorCode, response: Response) {
    super(
      "builder",
      `build failed with code ${String(code)}: ${describe(BUILDER_MESSAGES, code)}`,
      response,
    );
    this.name = "BuilderError";
    this.code = code;
  }

  static override is(value: unknown): value is BuilderError {
    return DocumentServerError.is(value) && value.kind === "builder";
  }
}

/** Where a request went, without the query: a download link carries its signature there. */
function location(url: string): string {
  try {
    const parsed = new URL(url);

    parsed.search = "";
    parsed.hash = "";

    return parsed.href;
  } catch {
    return "";
  }
}

function at(url: string): string {
  return url === "" ? "" : ` at ${url}`;
}

/**
 * The reason `fetch` gave, and what lies under it: the system error code, such as
 * `ECONNREFUSED`, or the message of the error when it has no code.
 */
function reason(cause: unknown): string {
  if (!(cause instanceof Error)) {
    return String(cause);
  }

  const inner: unknown = cause.cause;
  let detail = "";

  if (typeof inner === "object" && inner !== null) {
    if ("code" in inner && typeof inner.code === "string") {
      detail = inner.code;
    } else if (inner instanceof Error) {
      detail = inner.message;
    }
  }

  return detail === "" ? cause.message : `${cause.message} (${detail})`;
}

/**
 * No answer came: the document server could not be reached, or the connection broke before
 * its answer had been read. The error `fetch` raised is the `cause`.
 */
export class DocumentServerNetworkError extends DocumentServerError {
  declare readonly kind: "network";
  declare readonly response: undefined;

  constructor(url: string, cause: unknown) {
    super(
      "network",
      `the document server could not be reached${at(location(url))}: ${reason(cause)}`,
      undefined,
      { cause, url },
    );
    this.name = "DocumentServerNetworkError";
  }

  static override is(value: unknown): value is DocumentServerNetworkError {
    return DocumentServerError.is(value) && value.kind === "network";
  }
}

/**
 * The deadline of the call ran out before the answer had been read. The `DOMException` the
 * abort raised is the `cause`.
 */
export class DocumentServerTimeoutError extends DocumentServerError {
  declare readonly kind: "timeout";
  declare readonly response: undefined;
  /** The deadline that ran out, in milliseconds. */
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number, cause: unknown) {
    super(
      "timeout",
      `the document server did not answer${at(location(url))} within ${String(timeoutMs)} ms`,
      undefined,
      { cause, url },
    );
    this.name = "DocumentServerTimeoutError";
    this.timeoutMs = timeoutMs;
  }

  static override is(value: unknown): value is DocumentServerTimeoutError {
    return DocumentServerError.is(value) && value.kind === "timeout";
  }
}
