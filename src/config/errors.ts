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

const BRAND = Symbol.for("@onlyoffice/docs-integration-sdk.config-error");

/** Why a config was refused, and the discriminant of {@link ConfigError}. */
export type ConfigErrorKind = "invalid" | "unsupported";

/**
 * A config that could not be built: a field the document server would reject (`invalid`),
 * or a file whose format no editor of the server opens (`unsupported`).
 */
export class ConfigError extends Error {
  /** Which of the checks refused the config. */
  readonly kind: ConfigErrorKind;
  /** Path of the field refused, such as `"document.title"`. */
  readonly field: string;

  constructor(kind: ConfigErrorKind, field: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigError";
    this.kind = kind;
    this.field = field;
  }

  /** @internal */
  get [BRAND](): true {
    return true;
  }

  /** Recognizes an error of this SDK, a second copy of the package included. */
  static is(value: unknown): value is ConfigError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
