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

import { JwtError } from "./errors.js";

const DEFAULT_ALGORITHM: JwtAlgorithm = "HS256";
const DEFAULT_EXPIRES_IN_SEC = 300;
const DEFAULT_CLOCK_TOLERANCE_SEC = 0;
const DEFAULT_AUTHORIZATION_HEADER = "Authorization";
const DEFAULT_AUTHORIZATION_PREFIX = "Bearer ";
const MAX_SECONDS = 2_147_483_647;
const MILLISECONDS_IN_SECOND = 1000;
const SEGMENTS = 3;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

const HASHES: Readonly<Record<string, string>> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type HmacKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

/** The HMAC algorithms the document server signs with. */
export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

/** Settings of a signer, applied to every token it makes. */
export interface JwtOptions {
  /** Secret the document server is configured with. Required, and not empty. */
  secret: string;
  /** Algorithm the token is signed with. Default: `"HS256"`. */
  algorithm?: JwtAlgorithm;
  /**
   * How long a token stays valid, in whole seconds from `1` to `2147483647`, written to
   * `exp`. `null` leaves the claim out and the token never expires. Default: `300`.
   */
  expiresInSec?: number | null;
  /**
   * Leeway on `exp` and `nbf`, in whole seconds from `0` to `2147483647`, for a document
   * server whose clock runs apart from ours. Default: `0`.
   */
  clockToleranceSec?: number;
}

/**
 * The endpoint a token is meant for: `"converter"` for `/converter` and
 * `/converter/from-file`, `"command"` for `/command`, `"docbuilder"` for `/docbuilder` and
 * `/docbuilder/from-file`.
 */
export type JwtOperation = "converter" | "command" | "docbuilder";

/** Overrides applied to a single token, on top of the signer options. */
export interface SignOptions {
  /** Lifetime of this token, in place of the configured one. */
  expiresInSec?: number | null;
  /**
   * Written to the `operation` claim, in place of one the payload carries. The document
   * server refuses a token whose `operation` names another endpoint, and the `from-file`
   * endpoints refuse one without it.
   */
  operation?: JwtOperation;
}

/** Overrides applied to a single check, on top of the signer options. */
export interface VerifyOptions {
  /** Leeway for this token, in place of the configured one. */
  clockToleranceSec?: number;
}

/** Headers of a request, as the `Headers` of fetch or as the plain object of Node. */
export type JwtHeaders = Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/** Where {@link DocumentServerJwt.verifyHeader} finds the token, on top of the check. */
export interface VerifyHeaderOptions extends VerifyOptions {
  /** Header the token is sent in. Default: `"Authorization"`. */
  authorizationHeader?: string;
  /** Written before the token in that header. Default: `"Bearer "`. */
  authorizationPrefix?: string;
}

function normalizeSecret(secret: string): string {
  if (secret === "") {
    throw new TypeError("secret must not be empty");
  }

  return secret;
}

function hashOf(algorithm: JwtAlgorithm): string {
  const hash = HASHES[algorithm];

  if (hash === undefined) {
    throw new TypeError(
      `algorithm must be one of ${Object.keys(HASHES).join(", ")}, got: ${algorithm}`,
    );
  }

  return hash;
}

function normalizeExpiresIn(expiresInSec: number | null): number | null {
  if (expiresInSec === null) {
    return null;
  }

  if (!Number.isInteger(expiresInSec) || expiresInSec <= 0 || expiresInSec > MAX_SECONDS) {
    throw new TypeError(
      `expiresInSec must be null or an integer from 1 to ${String(MAX_SECONDS)}, got: ${String(expiresInSec)}`,
    );
  }

  return expiresInSec;
}

function normalizeTolerance(clockToleranceSec: number): number {
  if (
    !Number.isInteger(clockToleranceSec) ||
    clockToleranceSec < 0 ||
    clockToleranceSec > MAX_SECONDS
  ) {
    throw new TypeError(
      `clockToleranceSec must be an integer from 0 to ${String(MAX_SECONDS)}, got: ${String(clockToleranceSec)}`,
    );
  }

  return clockToleranceSec;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function segment(value: unknown): string {
  return base64url(encoder.encode(JSON.stringify(value)));
}

function fromBase64url(text: string, what: string): Uint8Array {
  if (!BASE64URL.test(text)) {
    throw new JwtError("malformed", `the ${what} of the token is not base64url`);
  }

  let binary: string;

  try {
    binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  } catch (cause) {
    throw new JwtError("malformed", `the ${what} of the token is not base64url`, { cause });
  }

  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  if (base64url(bytes) !== text) {
    throw new JwtError("malformed", `the ${what} of the token is not canonical base64url`);
  }

  return bytes;
}

function parseSegment(text: string, what: string): Record<string, unknown> {
  let value: unknown;

  try {
    value = JSON.parse(decoder.decode(fromBase64url(text, what))) as unknown;
  } catch (cause) {
    if (JwtError.is(cause)) {
      throw cause;
    }

    throw new JwtError("malformed", `the ${what} of the token is not JSON`, { cause });
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new JwtError("malformed", `the ${what} of the token is not a JSON object`);
  }

  return value as Record<string, unknown>;
}

function secondsClaim(claims: Record<string, unknown>, name: string): number | undefined {
  const value = claims[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new JwtError("malformed", `the ${name} claim of the token is not a number`);
  }

  return value;
}

function isPlainObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function describeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return "an array";
  }

  if (typeof value !== "object" || value === null) {
    return value === null ? "null" : typeof value;
  }

  const name: unknown = (value as { constructor?: { name?: unknown } }).constructor?.name;

  return typeof name === "string" && name !== "" ? `an instance of ${name}` : "an object";
}

function isHeaders(headers: JwtHeaders): headers is Headers {
  return typeof headers.get === "function";
}

function headerValue(headers: JwtHeaders, name: string): string | undefined {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnset(value: unknown): boolean {
  return value === undefined || value === null;
}

function assertPlainObject(payload: object): void {
  if (!isPlainObject(payload)) {
    throw new TypeError(`payload must be a JSON object, got: ${describeValue(payload)}`);
  }
}

function withClaims(
  payload: object,
  expiresInSec: number | null,
  operation: JwtOperation | undefined,
): object {
  assertPlainObject(payload);

  const now = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
  const claims: Record<string, unknown> = { ...payload };

  if (operation !== undefined) {
    claims["operation"] = operation;
  }

  if (isUnset(claims["iat"])) {
    claims["iat"] = now;
  }

  if (!isUnset(claims["exp"])) {
    return claims;
  }

  if (expiresInSec === null) {
    delete claims["exp"];
  } else {
    claims["exp"] = now + expiresInSec;
  }

  return claims;
}

/**
 * Signs the tokens the document server expects, over the secret it is configured with.
 *
 * One signer stands for one secret. A server configured with separate `inbox`, `outbox`
 * and `session` secrets takes a signer for each.
 */
export class DocumentServerJwt {
  /**
   * The effective settings: validated, with the defaults applied, and frozen. The secret is
   * kept out of them, so that logging the signer does not write it out.
   */
  readonly options: Readonly<Required<Omit<JwtOptions, "secret">>>;

  readonly #secret: string;
  readonly #hash: string;
  #key?: Promise<HmacKey>;

  constructor(options: JwtOptions) {
    const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
    const expiresInSec =
      options.expiresInSec === undefined ? DEFAULT_EXPIRES_IN_SEC : options.expiresInSec;

    this.#secret = normalizeSecret(options.secret);
    this.#hash = hashOf(algorithm);
    this.options = Object.freeze({
      algorithm,
      expiresInSec: normalizeExpiresIn(expiresInSec),
      clockToleranceSec: normalizeTolerance(
        options.clockToleranceSec ?? DEFAULT_CLOCK_TOLERANCE_SEC,
      ),
    });
  }

  #cryptoKey(): Promise<HmacKey> {
    this.#key ??= crypto.subtle
      .importKey("raw", encoder.encode(this.#secret), { name: "HMAC", hash: this.#hash }, false, [
        "sign",
        "verify",
      ])
      .catch((error: unknown) => {
        this.#key = undefined;

        throw error;
      });

    return this.#key;
  }

  /**
   * Signs `payload` into a token in the compact serialization.
   *
   * `iat` and `exp` are added, each unless the payload already carries it. A claim set to
   * `undefined` or `null` counts as not carried. `operation`, when given, is written over
   * the one the payload carries.
   *
   * @throws {TypeError} when the payload is not a plain object — an array, a `Map`, an
   * instance of a class — or the lifetime is neither `null` nor a positive integer.
   */
  async sign(payload: object, options?: SignOptions): Promise<string> {
    const expiresInSec =
      options?.expiresInSec === undefined ? this.options.expiresInSec : options.expiresInSec;
    const head = segment({ alg: this.options.algorithm, typ: "JWT" });
    const body = segment(withClaims(payload, normalizeExpiresIn(expiresInSec), options?.operation));
    const data = `${head}.${body}`;
    const signature = await crypto.subtle.sign(
      "HMAC",
      await this.#cryptoKey(),
      encoder.encode(data),
    );

    return `${data}.${base64url(new Uint8Array(signature))}`;
  }

  /**
   * Signs `payload` into a token for a header of a request to the document server, which
   * takes the body of such a request wrapped as `{ payload: … }`.
   *
   * `iat`, `exp` and `operation` go beside `payload`, as {@link DocumentServerJwt.sign}
   * writes them. The document server does not look for `operation` inside `payload`.
   *
   * @throws {TypeError} whenever {@link DocumentServerJwt.sign} would.
   */
  async signHeader(payload: object, options?: SignOptions): Promise<string> {
    assertPlainObject(payload);

    return await this.sign({ payload }, options);
  }

  /**
   * Checks a token against the secret and the clock, and answers with what it carries.
   *
   * The algorithm is the one the signer is configured with: a token naming another in its
   * header is refused rather than taken at its word. `exp` and `nbf` are honoured when
   * present, `iat` is not. The payload is parsed only once the signature has matched.
   *
   * @throws {@link JwtError} when the token is malformed, signed with another algorithm
   * or another secret, expired, or not valid yet.
   */
  async verify<T = Record<string, unknown>>(token: string, options?: VerifyOptions): Promise<T> {
    if (typeof token !== "string") {
      throw new JwtError("malformed", `a token is a string, got: ${describeValue(token)}`);
    }

    const segments = token.split(".");

    if (segments.length !== SEGMENTS) {
      throw new JwtError(
        "malformed",
        `a token has ${String(SEGMENTS)} segments, got ${String(segments.length)}`,
      );
    }

    const [head, body, signature] = segments as [string, string, string];
    const algorithm = parseSegment(head, "header")["alg"];

    if (algorithm !== this.options.algorithm) {
      throw new JwtError(
        "algorithm",
        `the token is signed with ${JSON.stringify(algorithm)}, expected ${this.options.algorithm}`,
      );
    }

    const matches = await crypto.subtle.verify(
      "HMAC",
      await this.#cryptoKey(),
      fromBase64url(signature, "signature"),
      encoder.encode(`${head}.${body}`),
    );

    if (!matches) {
      throw new JwtError("signature", "the token was signed with another secret");
    }

    const claims = parseSegment(body, "payload");
    const tolerance = normalizeTolerance(
      options?.clockToleranceSec ?? this.options.clockToleranceSec,
    );
    const now = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
    const exp = secondsClaim(claims, "exp");
    const nbf = secondsClaim(claims, "nbf");

    if (exp !== undefined && now >= exp + tolerance) {
      throw new JwtError("expired", `the token expired at ${String(exp)}, now ${String(now)}`);
    }

    if (nbf !== undefined && now + tolerance < nbf) {
      throw new JwtError(
        "premature",
        `the token is not valid before ${String(nbf)}, now ${String(now)}`,
      );
    }

    return claims as T;
  }

  /**
   * Checks the token the document server sent in a header of its request, and answers with
   * the `payload` it signs.
   *
   * The document server signs what it sends — the download of a file, a callback — in the
   * `Authorization` header by default, as `Bearer <token>`, and the claims of such a token
   * wrap what the request is about under `payload`. The header and the prefix are the
   * `token.outbox.header` and `token.outbox.prefix` settings of the server.
   *
   * @throws {@link JwtError} `missing` when the header carries no token, `malformed` when
   * the token carries no `payload` object, and whatever {@link DocumentServerJwt.verify}
   * refuses it with.
   */
  async verifyHeader<T = Record<string, unknown>>(
    headers: JwtHeaders,
    options?: VerifyHeaderOptions,
  ): Promise<T> {
    const name = options?.authorizationHeader ?? DEFAULT_AUTHORIZATION_HEADER;
    const prefix = options?.authorizationPrefix ?? DEFAULT_AUTHORIZATION_PREFIX;
    const value = headerValue(headers, name);

    if (value?.startsWith(prefix) !== true || value.length === prefix.length) {
      throw new JwtError("missing", `the request carries no token in ${name}`);
    }

    const claims = await this.verify(value.slice(prefix.length), options);

    if (!isRecord(claims["payload"])) {
      throw new JwtError("malformed", `the token in ${name} carries no payload`);
    }

    return claims["payload"] as T;
  }
}
