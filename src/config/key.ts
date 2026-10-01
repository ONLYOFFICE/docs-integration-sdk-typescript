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

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function checkPart(part: unknown, index: number): string {
  if (typeof part === "string") {
    return part;
  }

  if (typeof part === "number" && Number.isFinite(part)) {
    return String(part);
  }

  throw new TypeError(
    `part ${String(index)} of a document key must be a string or a finite number, got: ${
      typeof part === "number" ? String(part) : typeof part
    }`,
  );
}

/**
 * Builds a document key from the parts that identify one revision of a file, such as the
 * instance of your system, the file ID and the version.
 *
 * The key is the SHA-256 of the parts in base64url: 43 characters the document server
 * accepts, however long the parts are. Different parts always give different keys, including
 * `("a_b", "c")` and `("a", "b_c")`. The same parts always give the same key. A number and its
 * string form count as the same part.
 *
 * A key stands for one revision, not for the file: the document server serves a document from
 * its cache when it sees a key it knows. So one part must change with every write of the file,
 * such as a version counter, an etag or a content hash.
 *
 * @example
 * ```ts
 * const key = await buildDocumentKey(instanceId, file.id, file.version);
 * ```
 *
 * @param parts The parts, strings or finite numbers.
 * @returns The key, 43 characters of base64url.
 * @throws {TypeError} when no part is given, every part is empty, or a part is neither a
 * string nor a finite number, such as `undefined` or `NaN`.
 * @see [Document keys](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/editor.md#document-keys)
 * @see [document.key](https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/#key)
 */
export async function buildDocumentKey(...parts: readonly (string | number)[]): Promise<string> {
  if (parts.length === 0) {
    throw new TypeError("a document key is built from at least one part");
  }

  const given = parts.map(checkPart);

  if (given.every((part) => part === "")) {
    throw new TypeError("a document key is built from at least one part that is not empty");
  }

  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(given)));

  return base64url(new Uint8Array(digest));
}
