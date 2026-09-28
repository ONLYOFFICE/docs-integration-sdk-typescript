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

const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.callback-error");

/** Why a callback was refused, and the discriminant of {@link CallbackError}. */
export type CallbackErrorKind = "body" | "signature" | "token" | "unhandled";

/**
 * A callback that could not be taken: a body that is not one, a token missing where one is
 * required, or a token the verifier refused, which is then the `cause`. Or, as
 * {@link DocumentServerCallback.handle} tells `onError`, a document saved on `6` with no
 * handler to store it.
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
