import { CallbackError } from "./errors.js";
import type {
  CallbackBody,
  CallbackClosed,
  CallbackEditing,
  CallbackEvent,
  CallbackForcesave,
  CallbackForcesaveError,
  CallbackReply,
  CallbackSave,
  CallbackSaveError,
  CallbackUnknown,
} from "./types.js";

const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";

const KINDS: Readonly<Record<number, CallbackEvent["kind"]>> = {
  1: "editing",
  2: "save",
  3: "save-error",
  4: "closed",
  6: "forcesave",
  7: "forcesave-error",
};

const WITH_URL: ReadonlySet<CallbackEvent["kind"]> = new Set(["forcesave", "save"]);

const OK: CallbackReply = Object.freeze({ error: 0 });
const FAIL: CallbackReply = Object.freeze({ error: 1 });

/**
 * What checks the token of a callback: {@link jwt!DocumentServerJwt | DocumentServerJwt} or
 * a verifier of your own.
 */
export interface CallbackVerifier {
  /** Answers with what the token carries, or rejects when it cannot be trusted. */
  verify(token: string): Promise<unknown>;
}

/** Headers of a request, as the `Headers` of fetch or as the plain object of Node. */
export type CallbackHeaders =
  Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/** A request to the callback URL, taken apart by the framework that received it. */
export interface CallbackInput {
  /** The body: parsed already, or as the text or the bytes it came in. */
  body: unknown;
  headers?: CallbackHeaders;
}

/** How a callback is checked. */
export interface CallbackOptions {
  /**
   * Checks the token the document server signed the callback with. `null` takes an
   * unsigned callback, for a document server with no secret; a token it carries is then
   * ignored rather than trusted.
   */
  verifier: CallbackVerifier | null;
  /** Header the token is sent in. Default: `"Authorization"`. */
  authorizationHeader?: string;
  /** Written before the token in that header. Default: `"Bearer "`. */
  authorizationPrefix?: string;
}

/** What is done with each event. A kind with no handler is taken as it is. */
export interface CallbackHandlers {
  save: (event: CallbackSave) => Promise<void> | void;
  editing?: (event: CallbackEditing) => Promise<void> | void;
  "save-error"?: (event: CallbackSaveError) => Promise<void> | void;
  closed?: (event: CallbackClosed) => Promise<void> | void;
  forcesave?: (event: CallbackForcesave) => Promise<void> | void;
  "forcesave-error"?: (event: CallbackForcesaveError) => Promise<void> | void;
  unknown?: (event: CallbackUnknown) => Promise<void> | void;
}

/** Overrides of how {@link DocumentServerCallback.handle} answers. */
export interface HandleOptions {
  /** Told of the error a handler failed with, before the callback is answered with `1`. */
  onError?: (error: unknown, event: CallbackEvent) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBody(body: unknown): unknown {
  const text =
    body instanceof Uint8Array
      ? new TextDecoder().decode(body)
      : typeof body === "string"
        ? body
        : undefined;

  if (text === undefined) {
    return body;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new CallbackError("body", "the body of the callback is not JSON", { cause: error });
  }
}

function isHeaders(headers: CallbackHeaders): headers is Headers {
  return typeof headers.get === "function";
}

function header(headers: CallbackHeaders | undefined, name: string): string | undefined {
  if (headers === undefined) {
    return undefined;
  }

  if (isHeaders(headers)) {
    return headers.get(name) ?? undefined;
  }

  const wanted = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) {
      return typeof value === "string" ? value : value?.[0];
    }
  }

  return undefined;
}

async function verify(verifier: CallbackVerifier, token: string): Promise<unknown> {
  try {
    return await verifier.verify(token);
  } catch (error) {
    throw new CallbackError("signature", "the token of the callback was refused", {
      cause: error,
    });
  }
}

async function trustedBody(input: CallbackInput, options: CallbackOptions): Promise<unknown> {
  const body = parseBody(input.body);

  if (options.verifier === null) {
    return body;
  }

  if (isRecord(body) && typeof body["token"] === "string") {
    return await verify(options.verifier, body["token"]);
  }

  const name = options.authorizationHeader ?? DEFAULT_AUTHORIZATION_HEADER;
  const prefix = options.authorizationPrefix ?? DEFAULT_AUTHORIZATION_PREFIX;
  const value = header(input.headers, name);

  if (value?.startsWith(prefix) !== true || value.length === prefix.length) {
    throw new CallbackError(
      "token",
      `the callback carries no token, in the body or in ${name}, and a verifier requires one`,
    );
  }

  const claims = await verify(options.verifier, value.slice(prefix.length));

  if (!isRecord(claims) || !isRecord(claims["payload"])) {
    throw new CallbackError("body", `the token in ${name} carries no payload`);
  }

  return claims["payload"];
}

function toEvent(body: unknown): CallbackEvent {
  if (!isRecord(body)) {
    throw new CallbackError(
      "body",
      `the body of the callback must be an object, got: ${body === null ? "null" : typeof body}`,
    );
  }

  const { key, status, url } = body;

  if (typeof key !== "string" || key === "") {
    throw new CallbackError("body", "the callback carries no key");
  }

  if (typeof status !== "number" || !Number.isInteger(status)) {
    throw new CallbackError(
      "body",
      `the status of the callback must be an integer, got: ${String(status)}`,
    );
  }

  const kind = KINDS[status] ?? "unknown";

  if (WITH_URL.has(kind) && typeof url !== "string") {
    throw new CallbackError("body", `a callback of status ${String(status)} carries no url`);
  }

  return Object.freeze({ ...(body as unknown as CallbackBody), kind }) as CallbackEvent;
}

/**
 * A request the document server posted to the callback URL: checked against its token,
 * and told apart by what it reports.
 *
 * The document server takes `{"error":0}` for an answer that the callback is dealt with,
 * and posts it again on anything else. A document saved on `2` or `6` is to be stored
 * before the answer, then, and {@link DocumentServerCallback.handle} answers so.
 */
export class DocumentServerCallback {
  /** The answer that the callback is dealt with. */
  static readonly ok: CallbackReply = OK;
  /** The answer that the callback is to be posted again. */
  static readonly fail: CallbackReply = FAIL;

  /** What the document server reports, frozen. */
  readonly event: CallbackEvent;

  /**
   * A callback out of a body already trusted. The body is not checked against a token:
   * {@link DocumentServerCallback.parse} is what does that.
   *
   * @throws {@link CallbackError} when the body is not an object, or carries no key, an
   * integer status, or the url a save comes with.
   */
  constructor(body: unknown) {
    this.event = toEvent(body);
  }

  /**
   * Checks a callback against its token and reads what it reports.
   *
   * A token in the body is checked first, one in the header if the body carries none. Once
   * the token is checked, what it carries is the callback, and the unsigned body is left
   * aside: in the body the token signs the callback itself, in the header it signs it as
   * `{ payload: … }`.
   *
   * @throws {@link CallbackError} when the body is not a callback, no token is found and a
   * verifier requires one, or the verifier refuses it.
   */
  static async parse(
    input: CallbackInput,
    options: CallbackOptions,
  ): Promise<DocumentServerCallback> {
    return new DocumentServerCallback(await trustedBody(input, options));
  }

  /**
   * {@link DocumentServerCallback.parse} over a `Request` of fetch, as Next.js, Hono, Deno
   * and the edge runtimes hand it over. The body is read.
   */
  static async fromRequest(
    request: Request,
    options: CallbackOptions,
  ): Promise<DocumentServerCallback> {
    return await DocumentServerCallback.parse(
      { body: await request.text(), headers: request.headers },
      options,
    );
  }

  /**
   * Runs the handler of the event and answers the way the document server expects:
   * {@link DocumentServerCallback.ok} once the handler is done, and
   * {@link DocumentServerCallback.fail} when it failed, so the document server posts the
   * callback again.
   *
   * A kind with no handler is answered with `ok`. `save` has to have one, since a document
   * left unstored on it is lost.
   */
  async handle(handlers: CallbackHandlers, options?: HandleOptions): Promise<CallbackReply> {
    const event = this.event;

    try {
      switch (event.kind) {
        case "editing":
          await handlers.editing?.(event);
          break;
        case "save":
          await handlers.save(event);
          break;
        case "save-error":
          await handlers["save-error"]?.(event);
          break;
        case "closed":
          await handlers.closed?.(event);
          break;
        case "forcesave":
          await handlers.forcesave?.(event);
          break;
        case "forcesave-error":
          await handlers["forcesave-error"]?.(event);
          break;
        case "unknown":
          await handlers.unknown?.(event);
          break;
      }
    } catch (error) {
      options?.onError?.(error, event);

      return FAIL;
    }

    return OK;
  }
}
