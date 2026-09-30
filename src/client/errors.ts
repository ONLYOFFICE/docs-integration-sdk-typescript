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

/**
 * Which failure an error stands for, the discriminant of {@link AnyDocumentServerError}:
 *
 * - `"network"`: {@link DocumentServerNetworkError}, no answer came;
 * - `"timeout"`: {@link DocumentServerTimeoutError}, the deadline passed;
 * - `"http"`: {@link DocumentServerHttpError}, a status outside the 2xx range;
 * - `"parse"`: {@link DocumentServerParseError}, a 2xx body that is not the promised JSON;
 * - `"conversion"`: {@link ConversionError}, an error code of the conversion service;
 * - `"command"`: {@link CommandError}, an error code of the command service;
 * - `"builder"`: {@link BuilderError}, an error code of the document builder service.
 */
export type DocumentServerErrorKind =
  "builder" | "command" | "conversion" | "http" | "network" | "parse" | "timeout";

/**
 * Every error a client call rejects with, apart from the reason of a cancelled `signal`.
 * {@link DocumentServerError.is} narrows to it, so a `switch` over `kind` gives each branch
 * the fields of its error.
 */
export type AnyDocumentServerError =
  | BuilderError
  | CommandError
  | ConversionError
  | DocumentServerHttpError
  | DocumentServerNetworkError
  | DocumentServerParseError
  | DocumentServerTimeoutError;

/**
 * The base class of every error a client call rejects with: a failure the document server
 * reports, an answer that is not the promised one, or no answer at all.
 *
 * @example
 * ```ts
 * try {
 *   await client.convert(request);
 * } catch (error) {
 *   if (ConversionError.is(error) && error.code === -5) {
 *     return askForThePassword();
 *   }
 *
 *   if (DocumentServerHttpError.is(error) && error.status >= 500) {
 *     return retryLater();
 *   }
 *
 *   throw error;
 * }
 * ```
 *
 * @see [Errors](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/errors.md)
 */
export class DocumentServerError extends Error {
  /** Which failure the error stands for. */
  readonly kind: DocumentServerErrorKind;

  /**
   * The response the error was read from, with its body already read. `undefined` for a
   * network error and a timeout, which can happen before any response.
   */
  readonly response: Response | undefined;

  /**
   * The URL of the request, without the query, since a download URL carries its signature
   * there. Taken from the response when there is one, so it is where a redirect ended. Empty
   * when unknown, such as for a `Response` your own `fetch` built by hand.
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

  /**
   * Returns whether `value` is any of the client errors, also one thrown by a second copy of
   * the package, which `instanceof` misses. Narrows to {@link AnyDocumentServerError}.
   */
  static is(value: unknown): value is AnyDocumentServerError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}

/**
 * The document server answered with a status outside the 2xx range. The message names the
 * status, the URL and the beginning of the body.
 */
export class DocumentServerHttpError extends DocumentServerError {
  declare readonly kind: "http";
  declare readonly response: Response;
  /** The status of the response. */
  readonly status: number;
  /**
   * The first 512 characters of the response body, trimmed, ending with `…` when the body goes
   * on. The body is read only that far, and for at most `timeoutMs`: what arrived by then, with
   * `…`. Empty when nothing of it could be read.
   */
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

  /** Returns whether `value` is a `DocumentServerHttpError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is DocumentServerHttpError {
    return DocumentServerError.is(value) && value.kind === "http";
  }
}

/**
 * A 2xx body is not the JSON the endpoint promises: not JSON at all, or JSON of another shape.
 * Expect it even in a healthy integration: a reverse proxy may answer `200 OK` with a page of
 * its own. For a body that is not JSON, the parse error is the `cause`.
 */
export class DocumentServerParseError extends DocumentServerError {
  declare readonly kind: "parse";
  declare readonly response: Response;
  /** The first 512 characters of the response body, trimmed. */
  readonly body: string;

  constructor(message: string, response: Response, body: string, options?: ErrorOptions) {
    super("parse", message, response, options);
    this.name = "DocumentServerParseError";
    this.body = body;
  }

  /** Returns whether `value` is a `DocumentServerParseError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is DocumentServerParseError {
    return DocumentServerError.is(value) && value.kind === "parse";
  }
}

/**
 * The conversion service answered `200 OK` with an error code. Thrown by {@link DocumentServerClient.convert} and {@link DocumentServerClient.convertFromFile}.
 * The message names the code and what it means.
 */
export class ConversionError extends DocumentServerError {
  declare readonly kind: "conversion";
  declare readonly response: Response;
  /**
   * The error code, one of {@link ConversionErrorCode}. A code the service doesn't document stays a
   * plain number, so keep a `default` branch in a `switch` over it.
   */
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

  /** Returns whether `value` is a `ConversionError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is ConversionError {
    return DocumentServerError.is(value) && value.kind === "conversion";
  }
}

/**
 * The command service answered `200 OK` with an error code. Thrown by {@link DocumentServerClient.command} for any code but `0` and `4`.
 * The message names the code and what it means.
 */
export class CommandError extends DocumentServerError {
  declare readonly kind: "command";
  declare readonly response: Response;
  /**
   * The error code, one of {@link CommandErrorCode}. A code the service doesn't document stays a
   * plain number, so keep a `default` branch in a `switch` over it.
   */
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

  /** Returns whether `value` is a `CommandError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is CommandError {
    return DocumentServerError.is(value) && value.kind === "command";
  }
}

/**
 * The builder service answered `200 OK` with an error code. Thrown by {@link DocumentServerClient.docbuilder} and
 * {@link DocumentServerClient.docbuilderFromFile}.
 * The message names the code and what it means.
 */
export class BuilderError extends DocumentServerError {
  declare readonly kind: "builder";
  declare readonly response: Response;
  /**
   * The error code, one of {@link BuilderErrorCode}. A code the service doesn't document stays a
   * plain number, so keep a `default` branch in a `switch` over it.
   */
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

  /** Returns whether `value` is a `BuilderError`, also one thrown by a second copy of the package. */
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
 * No answer came: the document server can't be reached, or the connection broke before the
 * answer was read, the body included.
 *
 * The error `fetch` threw is the `cause`, such as `TypeError: fetch failed`. The message adds
 * the system error code under it, such as `ECONNREFUSED`, or else that error's message.
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

  /** Returns whether `value` is a `DocumentServerNetworkError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is DocumentServerNetworkError {
    return DocumentServerError.is(value) && value.kind === "network";
  }
}

/**
 * The deadline, `timeoutMs`, passed before the answer was read. The `DOMException` named
 * `"TimeoutError"` is the `cause`.
 *
 * A call cancelled with your own `signal` rejects with the reason of that signal instead, a
 * signal of `AbortSignal.timeout()` included.
 */
export class DocumentServerTimeoutError extends DocumentServerError {
  declare readonly kind: "timeout";
  declare readonly response: undefined;
  /** The deadline that passed, in milliseconds. */
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

  /** Returns whether `value` is a `DocumentServerTimeoutError`, also one thrown by a second copy of the package. */
  static override is(value: unknown): value is DocumentServerTimeoutError {
    return DocumentServerError.is(value) && value.kind === "timeout";
  }
}
