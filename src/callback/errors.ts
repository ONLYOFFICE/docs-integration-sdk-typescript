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

/**
 * Why a callback was refused, the discriminant of {@link CallbackError}:
 *
 * - `"body"`: the body is not a callback the document server sends;
 * - `"token"`: a verifier is set and the callback carries no token;
 * - `"signature"`: the verifier rejected the token;
 * - `"unhandled"`: a `forcesave` event has no handler. Only passed to `onError` of
 *   {@link DocumentServerCallback.handle}, never thrown.
 */
export type CallbackErrorKind = "body" | "signature" | "token" | "unhandled";

/**
 * Thrown by {@link DocumentServerCallback.parse}, {@link DocumentServerCallback.fromRequest}
 * and the {@link DocumentServerCallback} constructor when a request is not a valid callback.
 * Such a request did not come from the document server: reply with an error status, `400` or
 * `403`, not with `fail`, which invites it again.
 *
 * {@link DocumentServerCallback.handle} passes one of kind `"unhandled"` to `onError`.
 */
export class CallbackError extends Error {
  /** Which check refused the callback. For `"signature"`, the verifier's error is the `cause`. */
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

  /**
   * Returns whether `value` is a `CallbackError`, also one thrown by a second copy of the
   * package, which `instanceof` misses.
   */
  static is(value: unknown): value is CallbackError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
