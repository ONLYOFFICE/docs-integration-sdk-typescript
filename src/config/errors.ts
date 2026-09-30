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

/**
 * Why a config was refused, the discriminant of {@link ConfigError}:
 *
 * - `"unsupported"`: no editor of the document server opens the format of the file;
 * - `"invalid"`: a field is missing, or has a value the document server would reject.
 */
export type ConfigErrorKind = "invalid" | "unsupported";

/**
 * Thrown by the {@link DocumentServerConfig} constructor when the config can't be built. The
 * constructor lists every check.
 */
export class ConfigError extends Error {
  /** Which check refused the config. */
  readonly kind: ConfigErrorKind;
  /** The path of the refused field, such as `"document.title"`, or `"config"` for the whole input. */
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

  /**
   * Returns whether `value` is a `ConfigError`, also one thrown by a second copy of the
   * package, which `instanceof` misses.
   */
  static is(value: unknown): value is ConfigError {
    return typeof value === "object" && value !== null && BRAND in value;
  }
}
