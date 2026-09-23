import { JwtError } from "./errors.js";

const DEFAULT_ALGORITHM: JwtAlgorithm = "HS256";
const DEFAULT_EXPIRES_IN_SEC = 300;
const DEFAULT_CLOCK_TOLERANCE_SEC = 0;
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

/** Overrides applied to a single token, on top of the signer options. */
export interface SignOptions {
  /** Lifetime of this token, in place of the configured one. */
  expiresInSec?: number | null;
}

/** Overrides applied to a single check, on top of the signer options. */
export interface VerifyOptions {
  /** Leeway for this token, in place of the configured one. */
  clockToleranceSec?: number;
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

function isUnset(value: unknown): boolean {
  return value === undefined || value === null;
}

function withClaims(payload: object, expiresInSec: number | null): object {
  if (!isPlainObject(payload)) {
    throw new TypeError(`payload must be a JSON object, got: ${describeValue(payload)}`);
  }

  const now = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
  const claims: Record<string, unknown> = { ...payload };

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
   * `undefined` or `null` counts as not carried.
   *
   * @throws {TypeError} when the payload is not a plain object — an array, a `Map`, an
   * instance of a class — or the lifetime is neither `null` nor a positive integer.
   */
  async sign(payload: object, options?: SignOptions): Promise<string> {
    const expiresInSec =
      options?.expiresInSec === undefined ? this.options.expiresInSec : options.expiresInSec;
    const head = segment({ alg: this.options.algorithm, typ: "JWT" });
    const body = segment(withClaims(payload, normalizeExpiresIn(expiresInSec)));
    const data = `${head}.${body}`;
    const signature = await crypto.subtle.sign(
      "HMAC",
      await this.#cryptoKey(),
      encoder.encode(data),
    );

    return `${data}.${base64url(new Uint8Array(signature))}`;
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
}
