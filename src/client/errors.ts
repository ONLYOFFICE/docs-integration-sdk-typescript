import type { BuilderErrorCode } from "./builder.js";
import type { CommandErrorCode } from "./command.js";
import type { ConversionErrorCode } from "./convert.js";

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

/** Everything the document server answers with that the SDK turns into a rejection. */
export class DocumentServerError extends Error {
  /** The response the error was read from. Its body has already been consumed. */
  readonly response: Response;

  constructor(message: string, response: Response, options?: ErrorOptions) {
    super(message, options);
    this.name = "DocumentServerError";
    this.response = response;
  }
}

/** The document server answered with a status outside the 2xx range. */
export class DocumentServerHttpError extends DocumentServerError {
  readonly status: number;
  /** Beginning of the response body, as far as it could be read. */
  readonly body: string;

  constructor(response: Response, body: string) {
    const status = `${String(response.status)} ${response.statusText}`.trim();

    super(`the document server answered ${status}${body === "" ? "" : `: ${body}`}`, response);
    this.name = "DocumentServerHttpError";
    this.status = response.status;
    this.body = body;
  }
}

/** The body of a successful response was not the JSON the endpoint promises. */
export class DocumentServerParseError extends DocumentServerError {
  /** Beginning of the response body, as far as it could be read. */
  readonly body: string;

  constructor(message: string, response: Response, body: string, options?: ErrorOptions) {
    super(message, response, options);
    this.name = "DocumentServerParseError";
    this.body = body;
  }
}

/** The conversion service reported a failure in a body it answered `200 OK` with. */
export class ConversionError extends DocumentServerError {
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode, response: Response) {
    super(
      `conversion failed with code ${String(code)}: ${describe(CONVERSION_MESSAGES, code)}`,
      response,
    );
    this.name = "ConversionError";
    this.code = code;
  }
}

/** The command service reported a failure in a body it answered `200 OK` with. */
export class CommandError extends DocumentServerError {
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, response: Response) {
    super(
      `command failed with code ${String(code)}: ${describe(COMMAND_MESSAGES, code)}`,
      response,
    );
    this.name = "CommandError";
    this.code = code;
  }
}

/** The builder service reported a failure in a body it answered `200 OK` with. */
export class BuilderError extends DocumentServerError {
  readonly code: BuilderErrorCode;

  constructor(code: BuilderErrorCode, response: Response) {
    super(`build failed with code ${String(code)}: ${describe(BUILDER_MESSAGES, code)}`, response);
    this.name = "BuilderError";
    this.code = code;
  }
}
