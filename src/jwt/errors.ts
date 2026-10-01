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

const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.jwt-error");

/**
 * Why a token was refused, the discriminant of {@link JwtError}:
 *
 * - `"malformed"`: not a valid JWT;
 * - `"algorithm"`: the token names another algorithm than the configured one;
 * - `"signature"`: the signature doesn't match the secret;
 * - `"expired"`: `exp` has passed;
 * - `"premature"`: `nbf` has not come yet;
 * - `"missing"`: the request header carries no token.
 */
export type JwtErrorKind =
  "algorithm" | "expired" | "malformed" | "missing" | "premature" | "signature";

/**
 * Thrown by {@link DocumentServerJwt.verify} and {@link DocumentServerJwt.verifyHeader} when a
 * token can't be trusted. Reply to such a request with `403`.
 *
 * Separate from the client errors: `JwtError.is()` and `DocumentServerError.is()` never both
 * return `true`.
 */
export class JwtError extends Error {
  /** Which check refused the token. */
  readonly kind: JwtErrorKind;

  /**
   * Creates the error, for a signer or verifier of your own that refuses a token the same way.
   *
   * @param kind Which check refused the token.
   * @param message What was wrong, for a log.
   * @param options The `cause`, such as the error the check failed with.
   */
  constructor(kind: JwtErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "JwtError";
    this.kind = kind;
  }

  /** @internal */
  get [BRAND](): true {
    return true;
  }

  /**
   * Returns whether `value` is a `JwtError`, also one thrown by a second copy of the package,
   * which `instanceof` misses.
   */
  static is(value: unknown): value is JwtError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
