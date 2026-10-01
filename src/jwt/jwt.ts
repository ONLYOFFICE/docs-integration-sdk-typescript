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
const DEFAULT_CLOCK_TOLERANCE_SEC = 3;
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

/**
 * The HMAC algorithms the document server signs with. Use the one it is configured with.
 *
 * @see [Token settings](https://api.onlyoffice.com/docs/docs-api/get-started/configuration/server-config/#token)
 */
export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

/** Settings of a {@link DocumentServerJwt}, applied to every token it signs or verifies. */
export interface JwtOptions {
  /** The secret the document server is configured with. Required, not empty. */
  secret: string;
  /** The algorithm tokens are signed and verified with. Default: `"HS256"`. */
  algorithm?: JwtAlgorithm;
  /**
   * How long a signed token is valid, written to `exp`: a whole number of seconds from `1` to
   * `2147483647`. `null` leaves `exp` out, and the token never expires. Default: `300`.
   */
  expiresInSec?: number | null;
  /**
   * Leeway on `exp` and `nbf` when verifying, for a document server whose clock differs from
   * yours: a whole number of seconds from `0` to `2147483647`. Default: `3`.
   */
  clockToleranceSec?: number;
}

/**
 * The endpoint a token is for, written to the `operation` claim:
 *
 * - `"converter"`: `/converter` and `/converter/from-file`;
 * - `"command"`: `/command`;
 * - `"docbuilder"`: `/docbuilder` and `/docbuilder/from-file`.
 */
export type JwtOperation = "converter" | "command" | "docbuilder";

/** Options of one {@link DocumentServerJwt.sign} call, over the signer options. */
export interface SignOptions {
  /** The lifetime of this token, instead of the configured one. Validated the same way. */
  expiresInSec?: number | null;
  /**
   * Written to the `operation` claim, over an `operation` the payload has.
   *
   * The document server refuses a token whose `operation` names another endpoint. The
   * `from-file` endpoints refuse a token without it; the others accept one without it.
   */
  operation?: JwtOperation;
}

/** Options of one {@link DocumentServerJwt.verify} call, over the signer options. */
export interface VerifyOptions {
  /** The leeway for this token, instead of the configured one. Validated the same way. */
  clockToleranceSec?: number;
}

/**
 * The headers of a request: fetch `Headers` or a plain Node headers object. Names are matched
 * in any case; of a header given several times, the first value is read.
 */
export type JwtHeaders = Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/**
 * Options of one {@link DocumentServerJwt.verifyHeader} call. Set the header and the prefix to
 * the `token.outbox.header` and `token.outbox.prefix` settings of the document server.
 *
 * @see [Token settings](https://api.onlyoffice.com/docs/docs-api/get-started/configuration/server-config/#token)
 */
export interface VerifyHeaderOptions extends VerifyOptions {
  /** The header the token is read from. Default: `"Authorization"`. */
  authorizationHeader?: string;
  /**
   * What comes before the token in that header, matched in any case. `""` reads a bare token.
   * Default: `"Bearer "`.
   */
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
 * Signs the tokens the document server expects and verifies the tokens it sends. HMAC comes
 * from WebCrypto, so there are no dependencies.
 *
 * One signer holds one secret. A document server with separate `inbox`, `outbox` and
 * `session` secrets needs a signer for each.
 *
 * @example
 * ```ts
 * const jwt = new DocumentServerJwt({ secret: process.env["DOCS_JWT_SECRET"] ?? "" });
 *
 * await client.convert({ ...request, token: await jwt.sign(request) });
 * await client.convert(request, await jwt.signHeader(request));
 *
 * const claims = await jwt.verify(token);
 * ```
 *
 * @see [JWT](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/jwt.md)
 * @see [Signature](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/)
 */
export class DocumentServerJwt {
  /**
   * The settings in effect: validated, with defaults, and frozen. The secret is left out, so
   * logging the signer doesn't reveal it.
   */
  readonly options: Readonly<Required<Omit<JwtOptions, "secret">>>;

  readonly #secret: string;
  readonly #hash: string;
  #key?: Promise<HmacKey>;

  /**
   * @param options The secret, and the defaults of every token.
   * @throws {TypeError} when `secret` is empty, `algorithm` is not one of
   * {@link JwtAlgorithm}, `expiresInSec` is neither `null` nor a whole number from `1` to
   * `2147483647`, or `clockToleranceSec` is not a whole number from `0` to `2147483647`.
   */
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
   * Signs `payload` into a token. Use it for a token in the request body, which signs the body
   * itself.
   *
   * Claims added to the payload:
   *
   * - `iat`, the current time, unless the payload has one;
   * - `exp`, the current time plus `expiresInSec`, unless the payload has one. Left out when
   *   `expiresInSec` is `null`;
   * - `operation`, when given in `options`, over an `operation` the payload has.
   *
   * A claim that is `undefined` or `null` in the payload counts as missing.
   *
   * @example
   * ```ts
   * await jwt.sign(payload); // expires in 5 minutes
   * await jwt.sign(payload, { expiresInSec: 3600 }); // in an hour
   * await jwt.sign(payload, { expiresInSec: null }); // never
   * await jwt.sign(request, { operation: "converter" });
   * ```
   *
   * @param payload A plain object: its prototype is `Object.prototype` or `null`.
   * @param options The lifetime and the `operation` claim of this token.
   * @returns The token, in the compact serialization.
   * @throws {TypeError} when `payload` is not a plain object, such as an array, a `Map` or an
   * instance of a class, or when `expiresInSec` is invalid.
   * @see [Token in the body](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-body/)
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
   * Signs `payload` into a token for the authorization header of a request. The document
   * server expects that token to sign the body wrapped as `{ payload: … }`, so
   * `signHeader(body)` is `sign({ payload: body })`.
   *
   * `iat`, `exp` and `operation` are added next to `payload`, as
   * {@link DocumentServerJwt.sign} adds them. The document server doesn't look for `operation`
   * inside `payload`.
   *
   * @param payload The request body, a plain object.
   * @param options The lifetime and the `operation` claim of this token.
   * @returns The token, to pass as the header argument of a client method.
   * @throws {TypeError} whenever {@link DocumentServerJwt.sign} would.
   * @see [Token in the header](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-header/)
   */
  async signHeader(payload: object, options?: SignOptions): Promise<string> {
    assertPlainObject(payload);

    return await this.sign({ payload }, options);
  }

  /**
   * Verifies a token and returns its claims.
   *
   * The checks, in order:
   *
   * 1. The `alg` of the token header must be the configured algorithm. A token that names
   *    another, `"none"` included, is refused before the signature is checked.
   * 2. The signature must match the secret.
   * 3. `exp` and `nbf`, when present, must be numbers, and the current time must be within
   *    them, give or take `clockToleranceSec`. `iat` is not checked.
   *
   * The payload is parsed only after the signature matches.
   *
   * @param token The token, in the compact serialization.
   * @param options The leeway for this token.
   * @returns The claims, typed as `T`. The type is not checked.
   * @throws {@link JwtError} of kind:
   *
   * - `"malformed"` when the token is not a string of three segments, a segment is not
   *   canonical base64url, the header or the payload is not a JSON object, or `exp` or `nbf` is
   *   not a number;
   * - `"algorithm"` when the header names another algorithm;
   * - `"signature"` when the signature doesn't match;
   * - `"expired"` when `exp` has passed;
   * - `"premature"` when `nbf` has not come yet.
   * @throws {TypeError} when `clockToleranceSec` is invalid.
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
   * Reads the token from the authorization header of a request the document server sent, such
   * as a file download, verifies it and returns its `payload` claim.
   *
   * The document server sends `Authorization: Bearer <token>` by default, and its claims wrap
   * the request data in `payload`.
   *
   * @example
   * ```ts
   * const { url } = await jwt.verifyHeader<{ url: string }>(request.headers);
   * ```
   *
   * @param headers The headers of the request.
   * @param options The header, the prefix and the leeway.
   * @returns The `payload` claim, typed as `T`. The type is not checked.
   * @throws {@link JwtError} of kind `"missing"` when the header is missing, has another
   * prefix or holds only the prefix. Use it to tell a request of the document server from one
   * of a user.
   * @throws {@link JwtError} of kind `"malformed"` when the token has no `payload` object, and
   * any error {@link DocumentServerJwt.verify} throws.
   * @see [Outgoing requests](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-header/#outgoing-requests)
   */
  async verifyHeader<T = Record<string, unknown>>(
    headers: JwtHeaders,
    options?: VerifyHeaderOptions,
  ): Promise<T> {
    const name = options?.authorizationHeader ?? DEFAULT_AUTHORIZATION_HEADER;
    const prefix = options?.authorizationPrefix ?? DEFAULT_AUTHORIZATION_PREFIX;
    const value = headerValue(headers, name);

    if (
      value === undefined ||
      value.length === prefix.length ||
      value.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()
    ) {
      throw new JwtError("missing", `the request carries no token in ${name}`);
    }

    const claims = await this.verify(value.slice(prefix.length), options);

    if (!isRecord(claims["payload"])) {
      throw new JwtError("malformed", `the token in ${name} carries no payload`);
    }

    return claims["payload"] as T;
  }
}
