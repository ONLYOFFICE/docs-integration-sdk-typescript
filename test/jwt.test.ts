import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DocumentServerError,
  DocumentServerJwt,
  JwtError,
  type JwtAlgorithm,
  type JwtOptions,
} from "../src/index.js";

const MAX_EXPIRES_IN_SEC = 2_147_483_647;

const HASHES: Readonly<Record<JwtAlgorithm, "sha256" | "sha384" | "sha512">> = {
  HS256: "sha256",
  HS384: "sha384",
  HS512: "sha512",
};

/** Splits a token into its three segments. */
function parts(token: string): [string, string, string] {
  const segments = token.split(".");

  expect(segments).toHaveLength(3);

  return segments as [string, string, string];
}

/** Parses back a segment of a token. */
function decode(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<string, unknown>;
}

/** The signature the signed part should carry, by an implementation of its own. */
function hmac(data: string, secret: string, algorithm: JwtAlgorithm = "HS256"): string {
  return createHmac(HASHES[algorithm], secret).update(data).digest("base64url");
}

/** A segment of a token, from what it should decode to. */
function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

/** A token built by hand, signed or left with a signature of its own. */
function craft(
  header: unknown,
  payload: unknown,
  options: { secret?: string; algorithm?: JwtAlgorithm; signature?: string } = {},
): string {
  const { secret = "secret", algorithm = "HS256", signature = "" } = options;
  const data = `${encode(header)}.${encode(payload)}`;

  return `${data}.${signature === "" ? hmac(data, secret, algorithm) : signature}`;
}

/** Whole seconds since the epoch, the unit every claim of a token counts in. */
function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** The `exp` a token signed now should carry. */
function expectedExp(expiresInSec: number): number {
  return Math.floor(Date.now() / 1000) + expiresInSec;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("jwt options", () => {
  it("applies the defaults", () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    expect(jwt.options).toEqual({
      algorithm: "HS256",
      expiresInSec: 300,
      clockToleranceSec: 0,
    });
  });

  it("keeps what was passed", () => {
    const options: Required<JwtOptions> = {
      secret: "secret",
      algorithm: "HS512",
      expiresInSec: 60,
      clockToleranceSec: 5,
    };

    expect(new DocumentServerJwt(options).options).toEqual({
      algorithm: "HS512",
      expiresInSec: 60,
      clockToleranceSec: 5,
    });
  });

  it("keeps the secret out of them", () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    expect(jwt.options).not.toHaveProperty("secret");
    expect(JSON.stringify(jwt)).not.toContain("secret");
  });

  it("freezes them", () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    expect(Object.isFrozen(jwt.options)).toBe(true);
  });

  it("does not take the default for a lifetime turned off", () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: null });

    expect(jwt.options.expiresInSec).toBeNull();
  });

  it("rejects an empty secret", () => {
    expect(() => new DocumentServerJwt({ secret: "" })).toThrow(TypeError);
  });

  it("rejects an algorithm it cannot sign with", () => {
    expect(
      () => new DocumentServerJwt({ secret: "secret", algorithm: "none" as JwtAlgorithm }),
    ).toThrow(/algorithm must be one of HS256, HS384, HS512/);
  });

  it.each([0, -1, 1.5, Number.NaN, MAX_EXPIRES_IN_SEC + 1])(
    "rejects a lifetime of %s",
    (expiresInSec) => {
      expect(() => new DocumentServerJwt({ secret: "secret", expiresInSec })).toThrow(TypeError);
    },
  );

  it.each([1, MAX_EXPIRES_IN_SEC])("accepts a lifetime of %s", (expiresInSec) => {
    expect(new DocumentServerJwt({ secret: "secret", expiresInSec }).options.expiresInSec).toBe(
      expiresInSec,
    );
  });
});

describe("sign", () => {
  it("signs the known vector", async () => {
    const jwt = new DocumentServerJwt({ secret: "your-256-bit-secret", expiresInSec: null });

    await expect(jwt.sign({ sub: "1234567890", name: "John Doe", iat: 1516239022 })).resolves.toBe(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    );
  });

  it("writes the algorithm into the header", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", algorithm: "HS384" });
    const [head] = parts(await jwt.sign({}));

    expect(decode(head)).toEqual({ alg: "HS384", typ: "JWT" });
  });

  it.each(["HS256", "HS384", "HS512"] as const)("signs with %s", async (algorithm) => {
    const jwt = new DocumentServerJwt({ secret: "secret", algorithm });
    const token = await jwt.sign({ key: "document" });
    const [head, body, signature] = parts(token);

    expect(signature).toBe(hmac(`${head}.${body}`, "secret", algorithm));
  });

  it("carries the payload through", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const [, body] = parts(await jwt.sign({ key: "document", outputtype: "pdf" }));

    expect(decode(body)).toMatchObject({ key: "document", outputtype: "pdf" });
  });

  it("adds iat and exp", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ key: "document" }));
    const claims = decode(body);

    expect(claims["iat"]).toBeCloseTo(Math.floor(Date.now() / 1000), 0);
    expect(claims["exp"]).toBeCloseTo(expectedExp(60), 0);
  });

  it("leaves out exp when the lifetime is turned off", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: null });
    const [, body] = parts(await jwt.sign({ key: "document" }));

    expect(decode(body)).not.toHaveProperty("exp");
    expect(decode(body)).toHaveProperty("iat");
  });

  it("keeps the claims the payload already carries", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ iat: 1516239022, exp: 1516239922 }));

    expect(decode(body)).toEqual({ iat: 1516239022, exp: 1516239922 });
  });

  it("takes a claim set to undefined as not carried", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ iat: undefined, exp: undefined }));
    const claims = decode(body);

    expect(claims["iat"]).toBeCloseTo(Math.floor(Date.now() / 1000), 0);
    expect(claims["exp"]).toBeCloseTo(expectedExp(60), 0);
  });

  it("takes a claim set to null as not carried", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ iat: null, exp: null }));
    const claims = decode(body);

    expect(claims["iat"]).toBeCloseTo(Math.floor(Date.now() / 1000), 0);
    expect(claims["exp"]).toBeCloseTo(expectedExp(60), 0);
  });

  it("leaves out an exp set to null when the lifetime is turned off", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: null });
    const token = await jwt.sign({ key: "document", exp: null });

    expect(decode(parts(token)[1])).not.toHaveProperty("exp");
    await expect(jwt.verify(token)).resolves.toMatchObject({ key: "document" });
  });

  it("takes a lifetime for one token", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ key: "document" }, { expiresInSec: 3600 }));

    expect(decode(body)["exp"]).toBeCloseTo(expectedExp(3600), 0);
  });

  it("takes a lifetime turned off for one token", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: 60 });
    const [, body] = parts(await jwt.sign({ key: "document" }, { expiresInSec: null }));

    expect(decode(body)).not.toHaveProperty("exp");
  });

  it("rejects a lifetime it cannot write", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    await expect(jwt.sign({}, { expiresInSec: 0 })).rejects.toThrow(TypeError);
  });

  it("rejects an array", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    await expect(jwt.sign([])).rejects.toThrow(/payload must be a JSON object/);
  });

  it("signs a payload outside latin-1", async () => {
    const jwt = new DocumentServerJwt({ secret: "секрет", expiresInSec: null });
    const token = await jwt.sign({ title: "Договор №1 — 📄.docx" });
    const [head, body, signature] = parts(token);

    expect(decode(body)).toMatchObject({ title: "Договор №1 — 📄.docx" });
    expect(signature).toBe(hmac(`${head}.${body}`, "секрет"));
  });

  it("writes segments that need no padding", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    expect(await jwt.sign({ key: "document" })).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it("imports the key once", async () => {
    const importKey = vi.spyOn(crypto.subtle, "importKey");
    const jwt = new DocumentServerJwt({ secret: "secret" });

    await jwt.sign({ key: "first" });
    await jwt.sign({ key: "second" });

    expect(importKey).toHaveBeenCalledTimes(1);
  });
});

describe("verify", () => {
  it("answers with what the token carries", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = await jwt.sign({ key: "document", outputtype: "pdf" });

    await expect(jwt.verify(token)).resolves.toMatchObject({
      key: "document",
      outputtype: "pdf",
    });
  });

  it("answers with the type the caller asserts", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = await jwt.sign({ key: "document" });
    const claims = await jwt.verify<{ key: string }>(token);

    expect(claims.key).toBe("document");
  });

  it.each(["HS256", "HS384", "HS512"] as const)(
    "checks a token signed with %s",
    async (algorithm) => {
      const jwt = new DocumentServerJwt({ secret: "secret", algorithm });

      await expect(jwt.verify(await jwt.sign({ key: "document" }))).resolves.toHaveProperty("key");
    },
  );

  it("refuses a token signed with another secret", async () => {
    const mine = new DocumentServerJwt({ secret: "secret" });
    const theirs = new DocumentServerJwt({ secret: "another secret" });

    await expect(mine.verify(await theirs.sign({ key: "document" }))).rejects.toMatchObject({
      name: "JwtError",
      kind: "signature",
    });
  });

  it("refuses a payload edited under a signature that was once valid", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const [head, , signature] = parts(await jwt.sign({ key: "document" }));
    const token = `${head}.${encode({ key: "another document" })}.${signature}`;

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "signature" });
  });

  it("refuses a token naming an algorithm of its own", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", algorithm: "HS512" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document" });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "algorithm" });
  });

  it("refuses a token signed with none", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "none", typ: "JWT" }, { key: "document" }, { signature: "x" });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "algorithm" });
  });

  it.each([
    ["no segments at all", "not-a-token"],
    ["two segments", "eyJhbGciOiJIUzI1NiJ9.eyJrZXkiOiJkIn0"],
    ["four segments", "a.b.c.d"],
    ["an empty string", ""],
  ])("refuses %s", async (_what, token) => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "malformed" });
  });

  it("refuses a header that is not JSON", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const head = Buffer.from("{", "utf8").toString("base64url");

    await expect(jwt.verify(`${head}.${encode({})}.x`)).rejects.toMatchObject({
      kind: "malformed",
    });
  });

  it("refuses a payload that is not a JSON object", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, ["document"]);

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "malformed" });
  });

  it("refuses an expired token", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document", exp: now() - 1 });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "expired" });
  });

  it("refuses a token expiring this very second", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document", exp: now() });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "expired" });
  });

  it("refuses a token that is not valid yet", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document", nbf: now() + 60 });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "premature" });
  });

  it("refuses a lifetime claim that is not a number", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document", exp: "tomorrow" });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "malformed" });
  });

  it("lets the clocks disagree within the tolerance", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", clockToleranceSec: 30 });
    const expired = craft({ alg: "HS256", typ: "JWT" }, { key: "document", exp: now() - 10 });
    const early = craft({ alg: "HS256", typ: "JWT" }, { key: "document", nbf: now() + 10 });

    await expect(jwt.verify(expired)).resolves.toHaveProperty("key");
    await expect(jwt.verify(early)).resolves.toHaveProperty("key");
  });

  it("takes a tolerance for one token", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const token = craft({ alg: "HS256", typ: "JWT" }, { key: "document", exp: now() - 10 });

    await expect(jwt.verify(token)).rejects.toMatchObject({ kind: "expired" });
    await expect(jwt.verify(token, { clockToleranceSec: 30 })).resolves.toHaveProperty("key");
  });

  it("rejects a tolerance it cannot apply", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });

    expect(() => new DocumentServerJwt({ secret: "secret", clockToleranceSec: -1 })).toThrow(
      TypeError,
    );
    await expect(jwt.verify(await jwt.sign({}), { clockToleranceSec: 1.5 })).rejects.toThrow(
      TypeError,
    );
  });

  it("takes a token with no lifetime at all", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret", expiresInSec: null });

    await expect(jwt.verify(await jwt.sign({ key: "document" }))).resolves.not.toHaveProperty(
      "exp",
    );
  });

  it("imports the key once across signing and checking", async () => {
    const importKey = vi.spyOn(crypto.subtle, "importKey");
    const jwt = new DocumentServerJwt({ secret: "secret" });

    await jwt.verify(await jwt.sign({ key: "document" }));

    expect(importKey).toHaveBeenCalledTimes(1);
  });
});

describe("recognizing a refused token", () => {
  it("is recognized by JwtError", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const error: unknown = await jwt.verify("not-a-token").catch((reason: unknown) => reason);

    expect(JwtError.is(error)).toBe(true);
    expect(error).toBeInstanceOf(JwtError);
  });

  it("is not taken for an error of the document server", async () => {
    const jwt = new DocumentServerJwt({ secret: "secret" });
    const error: unknown = await jwt.verify("not-a-token").catch((reason: unknown) => reason);

    expect(DocumentServerError.is(error)).toBe(false);
  });

  it("does not take anything else for one", () => {
    expect(JwtError.is(new Error("no"))).toBe(false);
    expect(JwtError.is(null)).toBe(false);
  });
});
