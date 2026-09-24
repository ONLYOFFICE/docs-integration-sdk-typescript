const MAX_KEY_LENGTH = 128;
const UNSUPPORTED = /[^0-9a-zA-Z._=-]+/g;
const EDGES = /^[-_]+|[-_]+$/g;
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

/** The key cut to leave room for a fingerprint, and given it. */
function withFingerprint(key: string, hash: string): string {
  const kept = key.slice(0, MAX_KEY_LENGTH - HASH_LENGTH - 1);

  return kept === "" ? hash : `${kept}-${hash}`;
}

/**
 * Builds a document key out of the parts that identify a revision of a file, such as its
 * identifier in your storage and the moment it was last written.
 *
 * The parts are joined with `_`, and every run of characters the document server does not
 * accept in a key becomes a `-`. That loses what those characters were — `Отчёт.docx` and
 * `Счёт.docx` would both come out `.docx` — so a key that had any replaced is given a
 * fingerprint of the parts as they were given, which keeps two such files apart. A key
 * that would come out longer than the 128 characters the server allows is cut to fit and
 * given a fingerprint too, so two long keys that differ only in their tail stay apart.
 *
 * The key stands for one revision, not for one file: a document the editors saved is a
 * new revision and takes a new key, or the server hands back the one it has cached.
 *
 * @throws {TypeError} when no part is given, or the parts are all empty.
 */
export function buildDocumentKey(...parts: readonly (string | number)[]): string {
  if (parts.length === 0) {
    throw new TypeError("a document key is built from at least one part");
  }

  const given = parts.map(String);
  const source = given.join("_");
  const joined = given.map((part) => part.replace(UNSUPPORTED, "-")).join("_");
  const key = joined.replace(EDGES, "");

  if (joined !== source) {
    return withFingerprint(key, fingerprint(source));
  }

  if (key === "") {
    throw new TypeError(`a document key must not be empty, got: ${parts.join(", ")}`);
  }

  return key.length <= MAX_KEY_LENGTH ? key : withFingerprint(key, fingerprint(key));
}
