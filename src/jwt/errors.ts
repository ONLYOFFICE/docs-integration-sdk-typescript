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

/** Why a token was refused, and the discriminant of {@link JwtError}. */
export type JwtErrorKind =
  "algorithm" | "expired" | "malformed" | "missing" | "premature" | "signature";

/**
 * A token that could not be trusted: missing where one is required, malformed, signed with
 * another algorithm or another secret, expired, or not valid yet.
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
