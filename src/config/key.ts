const MAX_KEY_LENGTH = 128;
const UNSUPPORTED = /[^0-9a-zA-Z._=-]+/g;
const FNV_OFFSET = 2_166_136_261;
const FNV_PRIME = 16_777_619;
const HASH_LENGTH = 7;
const RADIX = 36;

function fingerprint(text: string): string {
  let value = FNV_OFFSET;

  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, FNV_PRIME);
  }

  return (value >>> 0).toString(RADIX).padStart(HASH_LENGTH, "0");
}

/**
 * Builds a document key out of the parts that identify a revision of a file, such as its
 * identifier in your storage and the moment it was last written.
 *
 * The parts are joined with `_`, and every character the document server does not accept
 * in a key becomes a `-`. A key that would come out longer than the 128 characters the
 * server allows is cut to fit and given a fingerprint of the whole, so two long keys that
 * differ only in their tail stay apart.
 *
 * The key stands for one revision, not for one file: a document the editors saved is a
 * new revision and takes a new key, or the server hands back the one it has cached.
 *
 * @throws {TypeError} when no part is given, or nothing is left of them.
 */
export function buildDocumentKey(...parts: readonly (string | number)[]): string {
  if (parts.length === 0) {
    throw new TypeError("a document key is built from at least one part");
  }

  const key = parts
    .map((part) => String(part).replace(UNSUPPORTED, "-"))
    .join("_")
    .replace(/^[-_]+|[-_]+$/g, "");

  if (key === "") {
    throw new TypeError(`a document key must not be empty, got: ${parts.join(", ")}`);
  }

  return key.length <= MAX_KEY_LENGTH
    ? key
    : `${key.slice(0, MAX_KEY_LENGTH - HASH_LENGTH - 1)}-${fingerprint(key)}`;
}
