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
 * Checks the token of a callback. {@link jwt!DocumentServerJwt | DocumentServerJwt} implements
 * it; any object with `verify()` works.
 */
export interface CallbackVerifier {
  /** Resolves to the claims of the token, or rejects when the token can't be trusted. */
  verify(token: string): Promise<unknown>;
}

/**
 * The headers of a request: fetch `Headers` or a plain Node headers object. Names are matched
 * in any case; of a header given several times, the first value is read.
 */
export type CallbackHeaders =
  Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/** A callback request taken apart, for a framework that parses the body itself. */
export interface CallbackInput {
  /**
   * The body: parsed JSON, or the raw body as a string, a `Uint8Array` (a `Buffer` included) or
   * an `ArrayBuffer`.
   */
  body: unknown;
  /** The headers of the request. Needed when the document server signs callbacks in a header. */
  headers?: CallbackHeaders;
}

/** How {@link DocumentServerCallback.parse} checks a callback. */
export interface CallbackOptions {
  /**
   * Checks the token of the callback. Required, so the check can't be turned off by
   * forgetting an option.
   *
   * `null` accepts unsigned callbacks, for a document server without a JWT secret. A token the
   * callback carries is then neither checked nor trusted.
   */
  verifier: CallbackVerifier | null;
  /** The header a token is read from. Default: `"Authorization"`. */
  authorizationHeader?: string;
  /** What comes before the token in that header. Default: `"Bearer "`. */
  authorizationPrefix?: string;
}

/**
 * The handlers {@link DocumentServerCallback.handle} runs, one for each event kind. A handler
 * may return a promise; the reply waits for it.
 */
export interface CallbackHandlers {
  /**
   * Status `2`: the last editor closed and the document changed. Download `url` and store the
   * document. Required.
   */
  save: (event: CallbackSave) => Promise<void> | void;
  /** Status `1`: a user connected or disconnected. Without a handler, answered `ok`. */
  editing?: (event: CallbackEditing) => Promise<void> | void;
  /** Status `3`: the document server failed to build the document. Without a handler, answered `ok`. */
  "save-error"?: (event: CallbackSaveError) => Promise<void> | void;
  /** Status `4`: the last editor closed and nothing changed. Without a handler, answered `ok`. */
  closed?: (event: CallbackClosed) => Promise<void> | void;
  /**
   * Status `6`: the document was saved while it is edited. Download `url` and store a version.
   * Without a handler, answered `fail`, and `onError` gets a {@link CallbackError} of kind
   * `"unhandled"`.
   */
  forcesave?: (event: CallbackForcesave) => Promise<void> | void;
  /** Status `7`: that save failed. Without a handler, answered `ok`. */
  "forcesave-error"?: (event: CallbackForcesaveError) => Promise<void> | void;
  /** A status this SDK doesn't know. Without a handler, answered `ok`. */
  unknown?: (event: CallbackUnknown) => Promise<void> | void;
}

/** Options of {@link DocumentServerCallback.handle}. */
export interface HandleOptions {
  /**
   * Called with the error a handler failed with, before the reply `fail` is returned. An error
   * `onError` throws itself is ignored, and the reply is still `fail`.
   */
  onError?: (error: unknown, event: CallbackEvent) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBody(body: unknown): unknown {
  const text =
    body instanceof Uint8Array || body instanceof ArrayBuffer
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
    return headers.get(name)?.split(", ")[0];
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
 * A callback the document server posted to `callbackUrl`, checked against its token.
 *
 * {@link DocumentServerCallback.fromRequest} or {@link DocumentServerCallback.parse} checks
 * the request, {@link DocumentServerCallback.event} says what happened, and
 * {@link DocumentServerCallback.handle} runs your handler and builds the reply.
 *
 * The document server expects the reply `{"error":0}`; on any other reply, the document editor
 * shows an error message.
 *
 * @example
 * ```ts
 * export async function POST(request: Request): Promise<Response> {
 *   const callback = await DocumentServerCallback.fromRequest(request, { verifier: jwt });
 *
 *   const reply = await callback.handle({
 *     save: async ({ url }) => {
 *       const { path, query } = splitFileUrl(url, publicUrl);
 *       await storage.saveNewVersion(fileId, (await client.getFile(path, query)).body);
 *     },
 *   });
 *
 *   return Response.json(reply);
 * }
 * ```
 *
 * @see [Handling callbacks](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/callback.md)
 */
export class DocumentServerCallback {
  /** The reply `{ error: 0 }`: the callback is handled. */
  static readonly ok: CallbackReply = OK;
  /** The reply `{ error: 1 }`: the callback is not handled. */
  static readonly fail: CallbackReply = FAIL;

  /** What the document server reports: the callback body plus `kind`, frozen. */
  readonly event: CallbackEvent;

  /**
   * Reads a callback body you already trust, without checking a token. To check the token,
   * use {@link DocumentServerCallback.parse} or {@link DocumentServerCallback.fromRequest}.
   *
   * @param body The callback body, parsed.
   * @throws {@link CallbackError} of kind `"body"` when the body is not an object, `key` is
   * not a non-empty string, `status` is not an integer, or `url` is not a string on status `2`
   * or `6`.
   */
  constructor(body: unknown) {
    this.event = toEvent(body);
  }

  /**
   * Checks the token of a callback and reads its body. For a framework that parses the body
   * itself, such as Express with `express.json()`.
   *
   * Where the token is looked for:
   *
   * 1. `token` in the body, when it is a string. It signs the callback itself.
   * 2. Otherwise the header named by `authorizationHeader`, after `authorizationPrefix`. It
   *    signs the callback as `{ payload: … }`.
   *
   * Once the token is checked, the callback is what the token carries, and the unsigned body
   * is ignored.
   *
   * @param input The body and the headers of the request.
   * @param options The verifier, and the header the token is read from.
   * @throws {@link CallbackError} of kind:
   *
   * - `"body"` when the body is a string or bytes that are not JSON, when a header token
   *   carries no `payload` object, or when the callback fails the checks of the
   *   {@link DocumentServerCallback | constructor};
   * - `"token"` when `verifier` is set and there is no token: no string `token` in the body,
   *   and the header is missing, has another prefix or holds only the prefix;
   * - `"signature"` when the verifier rejects the token. Its error is the `cause`.
   */
  static async parse(
    input: CallbackInput,
    options: CallbackOptions,
  ): Promise<DocumentServerCallback> {
    return new DocumentServerCallback(await trustedBody(input, options));
  }

  /**
   * Reads the body of a fetch `Request`, as Next.js, Hono, Deno and edge runtimes give it, and
   * checks it like {@link DocumentServerCallback.parse}.
   *
   * @param request The request posted to `callbackUrl`. Its body is read.
   * @param options The verifier, and the header the token is read from.
   * @throws {@link CallbackError} whenever {@link DocumentServerCallback.parse} would.
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
   * Runs the handler for {@link DocumentServerCallback.event} and returns the reply to send:
   *
   * - {@link DocumentServerCallback.ok} when the handler finished, or when the kind has no
   *   handler, except `forcesave`;
   * - {@link DocumentServerCallback.fail} when the handler threw or rejected, or when a
   *   `forcesave` event has no handler. `onError` is called first; for a missing `forcesave`
   *   handler it gets a {@link CallbackError} of kind `"unhandled"`.
   *
   * Never rejects: every failure becomes the reply `fail`.
   *
   * @param handlers The handlers, one for each event kind. `save` is required.
   * @param options `onError`, to log a failure.
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
          if (handlers.forcesave === undefined) {
            throw new CallbackError(
              "unhandled",
              "a callback of status 6 carries a document to store, and no forcesave handler is given",
            );
          }

          await handlers.forcesave(event);
          break;
        case "forcesave-error":
          await handlers["forcesave-error"]?.(event);
          break;
        case "unknown":
          await handlers.unknown?.(event);
          break;
      }
    } catch (error) {
      try {
        options?.onError?.(error, event);
      } catch {}

      return FAIL;
    }

    return OK;
  }
}
