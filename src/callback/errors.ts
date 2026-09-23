const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.callback-error");

/** Why a callback was refused, and the discriminant of {@link CallbackError}. */
export type CallbackErrorKind = "body" | "signature" | "token";

/**
 * A callback that could not be taken: a body that is not one, a token missing where one is
 * required, or a token the verifier refused, which is then the `cause`.
 */
export class CallbackError extends Error {
  /** Which of the checks refused the callback. */
  readonly kind: CallbackErrorKind;

  constructor(kind: CallbackErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CallbackError";
    this.kind = kind;
  }

  /** @internal */
  get [BRAND](): true {
    return true;
  }

  /** Recognizes an error of this SDK, a second copy of the package included. */
  static is(value: unknown): value is CallbackError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
