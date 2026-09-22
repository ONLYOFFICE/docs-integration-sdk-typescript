const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.jwt-error");

/** Why a token was refused, and the discriminant of {@link JwtError}. */
export type JwtErrorKind = "algorithm" | "expired" | "malformed" | "premature" | "signature";

/**
 * A token that could not be trusted: malformed, signed with another algorithm or another
 * secret, expired, or not valid yet.
 */
export class JwtError extends Error {
  /** Which of the checks refused the token. */
  readonly kind: JwtErrorKind;

  constructor(kind: JwtErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "JwtError";
    this.kind = kind;
  }

  /** @internal */
  get [BRAND](): true {
    return true;
  }

  /** Recognizes an error of this SDK, a second copy of the package included. */
  static is(value: unknown): value is JwtError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
