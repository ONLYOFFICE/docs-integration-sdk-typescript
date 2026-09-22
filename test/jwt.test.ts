import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentServerJwt, type JwtAlgorithm, type JwtOptions } from "../src/index.js";

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

    expect(jwt.options).toEqual({ secret: "secret", algorithm: "HS256", expiresInSec: 300 });
  });

  it("keeps what was passed", () => {
    const options: JwtOptions = { secret: "secret", algorithm: "HS512", expiresInSec: 60 };

    expect(new DocumentServerJwt(options).options).toEqual(options);
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
