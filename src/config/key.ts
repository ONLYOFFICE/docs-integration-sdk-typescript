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
 * Builds a document key out of the parts that identify a revision of a file, such as the
 * instance of your system, the identifier of the file in your storage and its version.
 *
 * The key is the SHA-256 of the parts, in base64url: 43 characters the document server
 * accepts, whatever the parts are made of and however long they are. Two lists of parts
 * that differ in any way — `["a_b", "c"]` and `["a", "b_c"]` included — never come out the
 * same key, and the same parts always do. A number and the string it is written as count
 * as the same part.
 *
 * The key stands for one revision, not for one file: a document the editors saved is a new
 * revision and takes a new key, or the server hands back the one it has cached. So one of
 * the parts has to change with every write — a version counter, an etag, a hash of the
 * content — and the key tells nothing of the file it was built from.
 *
 * @throws {TypeError} when no part is given, every part is empty, or a part is neither a
 * string nor a finite number.
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
