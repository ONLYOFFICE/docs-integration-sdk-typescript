const DEFAULT_ALGORITHM: JwtAlgorithm = "HS256";
const DEFAULT_EXPIRES_IN_SEC = 300;
const MAX_EXPIRES_IN_SEC = 2_147_483_647;
const MILLISECONDS_IN_SECOND = 1000;

const HASHES: Readonly<Record<string, string>> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

const encoder = new TextEncoder();

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
}

/** Overrides applied to a single token, on top of the signer options. */
export interface SignOptions {
  /** Lifetime of this token, in place of the configured one. */
  expiresInSec?: number | null;
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

  if (!Number.isInteger(expiresInSec) || expiresInSec <= 0 || expiresInSec > MAX_EXPIRES_IN_SEC) {
    throw new TypeError(
      `expiresInSec must be null or an integer from 1 to ${String(MAX_EXPIRES_IN_SEC)}, got: ${String(expiresInSec)}`,
    );
  }

  return expiresInSec;
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

function withClaims(payload: object, expiresInSec: number | null): object {
  if (Array.isArray(payload)) {
    throw new TypeError("payload must be a JSON object, got an array");
  }

  const now = Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
  const claims: Record<string, number> = {};

  if (!("iat" in payload)) {
    claims["iat"] = now;
  }

  if (expiresInSec !== null && !("exp" in payload)) {
    claims["exp"] = now + expiresInSec;
  }

  return { ...payload, ...claims };
}

/**
 * Signs the tokens the document server expects, over the secret it is configured with.
 *
 * One signer stands for one secret. A server configured with separate `inbox`, `outbox`
 * and `session` secrets takes a signer for each.
 */
export class DocumentServerJwt {
  /** The effective settings: validated, with the defaults applied, and frozen. */
  readonly options: Readonly<Required<JwtOptions>>;

  readonly #hash: string;
  #key?: Promise<HmacKey>;

  constructor(options: JwtOptions) {
    const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
    const expiresInSec =
      options.expiresInSec === undefined ? DEFAULT_EXPIRES_IN_SEC : options.expiresInSec;

    this.#hash = hashOf(algorithm);
    this.options = Object.freeze({
      secret: normalizeSecret(options.secret),
      algorithm,
      expiresInSec: normalizeExpiresIn(expiresInSec),
    });
  }

  #cryptoKey(): Promise<HmacKey> {
    this.#key ??= crypto.subtle.importKey(
      "raw",
      encoder.encode(this.options.secret),
      { name: "HMAC", hash: this.#hash },
      false,
      ["sign"],
    );

    return this.#key;
  }

  /**
   * Signs `payload` into a token in the compact serialization.
   *
   * `iat` and `exp` are added, each unless the payload already carries it.
   *
   * @throws {TypeError} when the payload is an array, or the lifetime is neither `null`
   * nor a positive integer.
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
}
