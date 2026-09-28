import { randomUUID } from "node:crypto";
import { DocumentServerClient, DocumentServerJwt, splitFileUrl } from "../../src/index.js";

export const DOCS_URL = process.env["DOCS_URL"] ?? "http://localhost:8080";
export const DOCS_JWT_SECRET = process.env["DOCS_JWT_SECRET"] ?? "integration-secret";
export const FIXTURES_URL = process.env["FIXTURES_URL"] ?? "http://fixtures";

export const client = new DocumentServerClient({ baseUrl: DOCS_URL, timeoutMs: 60_000 });
export const jwt = new DocumentServerJwt({ secret: DOCS_JWT_SECRET });

/** A document key no earlier run has used, so the server converts rather than answers from its cache. */
export function uniqueKey(): string {
  return randomUUID();
}

/** Where the fixtures server publishes a fixture, as the document server reaches it. */
export function fixtureUrl(name: string): string {
  return `${FIXTURES_URL}/${name}`;
}

/** Asks again, a second apart, until `done` holds or a minute has passed. */
export async function poll<T>(ask: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 60_000;

  for (;;) {
    const value = await ask();

    if (done(value) || Date.now() > deadline) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}

/** The first bytes of a file the document server handed out a location for. */
export async function downloadHead(fileUrl: string, length: number): Promise<string> {
  const { path, query } = splitFileUrl(fileUrl, DOCS_URL);
  const response = await client.getFile(path, query);

  return head(response, length);
}

/** The first bytes of a response, as text. */
export async function head(response: Response, length: number): Promise<string> {
  const bytes = new Uint8Array(await response.arrayBuffer());

  return new TextDecoder().decode(bytes.subarray(0, length));
}
