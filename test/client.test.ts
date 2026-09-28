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

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BuilderError,
  CommandError,
  ConversionError,
  DocumentServerClient,
  DocumentServerError,
  DocumentServerHttpError,
  DocumentServerNetworkError,
  DocumentServerParseError,
  DocumentServerTimeoutError,
  splitFileUrl,
  type BuildFileRequest,
  type BuilderRequest,
  type BuilderResponse,
  type ClientOptions,
  type ConfigResponse,
  type FormatsResponse,
  type BuilderErrorCode,
  type CommandErrorCode,
  type CommandRequest,
  type CommandResponse,
  type ConversionErrorCode,
  type ConvertFileRequest,
  type ConvertRequest,
  type ConvertResponse,
  type RequestOptions,
} from "../src/index.js";

const MAX_TIMEOUT_MS = 2_147_483_647;

interface RecordedCall {
  url: string;
  init: RequestInit | undefined;
}

/** Records every call and answers with a canned response. */
function spyFetch(respond: () => Response = () => new Response("true")) {
  const calls: RecordedCall[] = [];

  const fetch = vi.fn((url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });

    return Promise.resolve(respond());
  });

  return { fetch, calls };
}

/** Never settles until its signal aborts, standing in for a hung server. */
function hangingFetch(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;

    if (signal) {
      signal.addEventListener("abort", () => {
        reject(signal.reason as Error);
      });
    }
  });
}

/** Parses back the JSON body of a recorded call. */
function bodyOf(call: RecordedCall | undefined): unknown {
  return JSON.parse(call?.init?.body as string) as unknown;
}

/** Reads a header off a recorded call, whichever shape it was passed in. */
function headerOf(call: RecordedCall | undefined, name: string): string | null {
  return new Headers(call?.init?.headers).get(name);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("options", () => {
  it("exposes the options type to consumers", () => {
    // Compile-time guard: typecheck fails if ClientOptions stops being exported.
    const options: ClientOptions = { baseUrl: "https://docs.example.com" };

    expect(new DocumentServerClient(options).options.baseUrl).toBe("https://docs.example.com");
  });

  it("applies the defaults", () => {
    const { options } = new DocumentServerClient({ baseUrl: "https://docs.example.com" });

    expect(options.timeoutMs).toBe(30_000);
    expect(options.headers).toEqual({});
    expect(options.authorizationHeader).toBe("Authorization");
    expect(options.authorizationPrefix).toBe("Bearer ");
    expect(typeof options.fetch).toBe("function");
  });

  it("keeps the values it was given", () => {
    const { fetch } = spyFetch();
    const { options } = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 1234,
      headers: { "x-tenant": "acme" },
      authorizationHeader: "X-Docs-Token",
      authorizationPrefix: "",
      fetch,
    });

    expect(options.timeoutMs).toBe(1234);
    expect(options.headers).toEqual({ "x-tenant": "acme" });
    expect(options.authorizationHeader).toBe("X-Docs-Token");
    expect(options.authorizationPrefix).toBe("");
    expect(options.fetch).toBe(fetch);
  });

  it.each([
    ["https://docs.example.com", "https://docs.example.com"],
    ["https://docs.example.com/", "https://docs.example.com"],
    ["https://docs.example.com///", "https://docs.example.com"],
    [" https://docs.example.com \n", "https://docs.example.com"],
    ["https://DOCS.Example.COM", "https://docs.example.com"],
    ["https://docs.example.com/office", "https://docs.example.com/office"],
    ["https://docs.example.com/office/", "https://docs.example.com/office"],
    ["https://docs.example.com/office?a=1#frag", "https://docs.example.com/office"],
    ["http://localhost:8080", "http://localhost:8080"],
  ])("normalizes %s", (baseUrl, expected) => {
    expect(new DocumentServerClient({ baseUrl }).options.baseUrl).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "docs.example.com",
    "/healthcheck",
    // The URL parser accepts any scheme, so a typo in the protocol parses fine.
    "htp://docs.example.com",
    "ftp://docs.example.com",
    "file:///etc/passwd",
  ])("rejects %s", (baseUrl) => {
    expect(() => new DocumentServerClient({ baseUrl })).toThrow(TypeError);
  });

  it("freezes the options and the headers", () => {
    const { options } = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
    });

    expect(Object.isFrozen(options)).toBe(true);
    expect(Object.isFrozen(options.headers)).toBe(true);
  });

  it("ignores changes made to the options object after construction", async () => {
    const { fetch, calls } = spyFetch();
    const passed = {
      baseUrl: "https://docs.example.com",
      timeoutMs: 5000,
      headers: { "x-tenant": "acme" },
      fetch,
    };
    const client = new DocumentServerClient(passed);

    passed.baseUrl = "http://evil.example.com";
    passed.timeoutMs = 1;
    passed.headers["x-tenant"] = "evil";

    await client.raw.healthcheck();

    expect(client.options.baseUrl).toBe("https://docs.example.com");
    expect(client.options.timeoutMs).toBe(5000);
    expect(calls[0]?.url).toBe("https://docs.example.com/healthcheck");
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });
});

describe("raw.healthcheck", () => {
  it("sends GET to /healthcheck", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.healthcheck();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/healthcheck");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.healthcheck();

    expect(calls[0]?.url).toBe("https://example.com/office/healthcheck");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.healthcheck();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no JSON headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.healthcheck();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "content-type")).toBeNull();
    expect(headerOf(calls[0], "accept")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.healthcheck();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => new Response("true", { status: 200 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.healthcheck();

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("true");
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("down", { status: 503 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.healthcheck();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.healthcheck()).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.healthcheck();

    expect(calls).toHaveLength(1);
  });

  it("picks up a global fetch patched after construction", async () => {
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });
    const { fetch, calls } = spyFetch();

    vi.stubGlobal("fetch", fetch);
    await client.raw.healthcheck();

    expect(calls).toHaveLength(1);
  });
});

describe("raw.getConfig", () => {
  const config = {
    authorization: { header: "Authorization", prefix: "Bearer " },
    urls: {
      api: "/web-apps/apps/api/documents/api.js",
      command: "/command",
      converter: "/converter",
      docbuilder: "/docbuilder",
    },
    limits: { maxFileSize: 104_857_600 },
    langs: ["en", "pt-PT", "zh-TW"],
  };

  it("sends GET to /meta/config", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getConfig();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/meta/config");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.getConfig();

    expect(calls[0]?.url).toBe("https://example.com/office/meta/config");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.getConfig();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no authorization header", async () => {
    // The endpoint describes the server rather than a document, so it takes no token.
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getConfig();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "authorization")).toBeNull();
    expect(headerOf(calls[0], "content-type")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getConfig();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.getConfig()).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => Response.json(config));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.getConfig();

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<ConfigResponse>).resolves.toEqual(config);
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("", { status: 404 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.getConfig();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.getConfig();

    expect(calls).toHaveLength(1);
  });
});

describe("raw.getFormats", () => {
  const formats = [
    {
      name: "docx",
      type: "word",
      actions: ["view", "edit", "review", "comment", "encrypt"],
      convert: ["bmp", "docm", "pdf", "txt"],
      mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    },
    // An output-only format carries no type and nothing the editors can do with it.
    { name: "png", type: "", actions: [], convert: [], mime: ["image/png"] },
  ];

  it("sends GET to /meta/formats", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getFormats();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/meta/formats");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.getFormats();

    expect(calls[0]?.url).toBe("https://example.com/office/meta/formats");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.getFormats();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getFormats();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "authorization")).toBeNull();
    expect(headerOf(calls[0], "content-type")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.getFormats();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.getFormats()).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => Response.json(formats));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.getFormats();

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<FormatsResponse>).resolves.toEqual(formats);
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("", { status: 404 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.getFormats();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.getFormats();

    expect(calls).toHaveLength(1);
  });
});

describe("raw.convert", () => {
  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };

  it("posts the request to /converter", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/converter?shardkey=Khirz6zTPdfd7");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the request as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert({
      ...docx,
      async: true,
      pdf: { form: true },
      watermark: { fill: [255, 0, 0], paragraphs: [{ runs: [{ "font-size": 40 }] }] },
    });

    expect(bodyOf(calls[0])).toEqual({
      filetype: "docx",
      key: "Khirz6zTPdfd7",
      outputtype: "pdf",
      url: "https://example.com/document.docx",
      async: true,
      pdf: { form: true },
      watermark: { fill: [255, 0, 0], paragraphs: [{ runs: [{ "font-size": 40 }] }] },
    });
  });

  it("asks for JSON rather than the default XML", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
    );

    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends the configured headers too", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.convert(docx);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("overrides a configured content type instead of merging with it", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "Content-Type": "text/plain" },
      fetch,
    }).raw.convert(docx);

    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
    );

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
      "jwt.header.token",
    );

    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
  });

  it("follows a configured header name and prefix", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      authorizationHeader: "X-Docs-Token",
      authorizationPrefix: "",
      fetch,
    }).raw.convert(docx, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("overrides a configured authorization header instead of merging with it", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { Authorization: "Bearer stale" },
      fetch,
    }).raw.convert(docx, "jwt.header.token");

    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
  });

  it("leaves the body signature to the caller", async () => {
    // The two tokens sign different payloads, so the header one never lands in the body.
    const { fetch, calls } = spyFetch();
    const request: ConvertRequest = { ...docx, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the request it was given", async () => {
    const { fetch } = spyFetch();
    const request: ConvertRequest = { ...docx };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(docx);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).raw.convert(
      docx,
    );

    expect(calls[0]?.url).toBe("https://example.com/office/converter?shardkey=Khirz6zTPdfd7");
  });

  it("pins the request to a shard with the document key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert({
      ...docx,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/converter?shardkey=a%20b%26c");
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
    );

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.convert(docx)).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response untouched", async () => {
    const body = {
      endConvert: true,
      fileType: "pdf",
      fileUrl: "https://docs.example.com/converted.pdf",
      percent: 100,
    };
    const { fetch } = spyFetch(() => Response.json(body));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convert(docx);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<ConvertResponse>).resolves.toEqual(body);
  });

  it("hands back a conversion error instead of throwing", async () => {
    // The service answers 200 even when the conversion failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: -8 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convert(docx);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<ConvertResponse>).resolves.toEqual({ error: -8 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.convert(docx);

    expect(calls).toHaveLength(1);
  });
});

describe("raw.command", () => {
  const info: CommandRequest = { c: "info", key: "Khirz6zTPdfd7" };

  it("posts the command to /command", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      info,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/command?shardkey=Khirz6zTPdfd7");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the command as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command({
      c: "meta",
      key: "Khirz6zTPdfd7",
      meta: { title: "Contract.docx" },
    });

    expect(bodyOf(calls[0])).toEqual({
      c: "meta",
      key: "Khirz6zTPdfd7",
      meta: { title: "Contract.docx" },
    });
  });

  it("asks for JSON rather than the default XML", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      info,
    );

    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends the configured headers too", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.command(info);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      info,
    );

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      info,
      "jwt.header.token",
    );

    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
  });

  it("follows a configured header name and prefix", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      authorizationHeader: "X-Docs-Token",
      authorizationPrefix: "",
      fetch,
    }).raw.command(info, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("leaves the body signature to the caller", async () => {
    const { fetch, calls } = spyFetch();
    const request: CommandRequest = { ...info, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the command it was given", async () => {
    const { fetch } = spyFetch();
    const request: CommandRequest = { ...info };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(info);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).raw.command(
      info,
    );

    expect(calls[0]?.url).toBe("https://example.com/office/command?shardkey=Khirz6zTPdfd7");
  });

  it("pins the command to a shard with the document key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command({
      ...info,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/command?shardkey=a%20b%26c");
  });

  it.each<CommandRequest>([{ c: "getForgottenList" }, { c: "license" }, { c: "version" }])(
    "sends no shardkey for a command without a key: %o",
    async (request) => {
      const { fetch, calls } = spyFetch();

      await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
        request,
      );

      expect(calls[0]?.url).toBe("https://docs.example.com/command");
    },
  );

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.command(
      info,
    );

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.command(info)).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response untouched", async () => {
    const body = { error: 0, key: "Khirz6zTPdfd7", users: ["6d5a81d0", "78e1e841"] };
    const { fetch } = spyFetch(() => Response.json(body));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.command(info);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<CommandResponse>).resolves.toEqual(body);
  });

  it("hands back a command error instead of throwing", async () => {
    // The service answers 200 even when the command failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: 6 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.command(info);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<CommandResponse>).resolves.toEqual({ error: 6 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.command(info);

    expect(calls).toHaveLength(1);
  });
});

describe("raw.docbuilder", () => {
  const script: BuilderRequest = { url: "https://example.com/script.js" };

  it("posts the request to /docbuilder", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      script,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the request as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder({
      async: true,
      url: "https://example.com/script.js",
      argument: { title: "Contract", rows: [1, 2] },
    });

    expect(bodyOf(calls[0])).toEqual({
      async: true,
      url: "https://example.com/script.js",
      argument: { title: "Contract", rows: [1, 2] },
    });
  });

  it("asks for JSON rather than the default XML", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      script,
    );

    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends the configured headers too", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.docbuilder(script);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      script,
    );

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      script,
      "jwt.header.token",
    );

    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
  });

  it("follows a configured header name and prefix", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      authorizationHeader: "X-Docs-Token",
      authorizationPrefix: "",
      fetch,
    }).raw.docbuilder(script, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("leaves the body signature to the caller", async () => {
    const { fetch, calls } = spyFetch();
    const request: BuilderRequest = { ...script, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the request it was given", async () => {
    const { fetch } = spyFetch();
    const request: BuilderRequest = { ...script };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(script);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.docbuilder(script);

    expect(calls[0]?.url).toBe("https://example.com/office/docbuilder");
  });

  it("pins a poll to a shard with the build key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder({
      async: true,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder?shardkey=a%20b%26c");
  });

  it("sends no shardkey before the service has minted a key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder({
      async: true,
      url: "https://example.com/script.js",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder");
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.docbuilder(
      script,
    );

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.docbuilder(script)).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response untouched", async () => {
    const body = {
      key: "af86C7e71Ca8",
      end: true,
      urls: { "output.docx": "https://docs.example.com/output.docx" },
    };
    const { fetch } = spyFetch(() => Response.json(body));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilder(script);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<BuilderResponse>).resolves.toEqual(body);
  });

  it("hands back a build error instead of throwing", async () => {
    // The service answers 200 even when the build failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: -8 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilder(script);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<BuilderResponse>).resolves.toEqual({ error: -8 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).raw.docbuilder(script);

    expect(calls).toHaveLength(1);
  });
});

describe("raw.convertFromFile", () => {
  const docx: ConvertFileRequest = { filetype: "docx", key: "Khirz6zTPdfd7", outputtype: "pdf" };
  const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

  /** Reads the form back off a recorded call. */
  function formOf(call: RecordedCall | undefined): FormData {
    return call?.init?.body as FormData;
  }

  it("posts the request to /converter/from-file", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://docs.example.com/converter/from-file?shardkey=Khirz6zTPdfd7",
    );
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends no shardkey when the service is left to make a key up", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile({ filetype: "docx", outputtype: "pdf" }, new Blob([bytes]));

    expect(calls[0]?.url).toBe("https://docs.example.com/converter/from-file");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect(calls[0]?.url).toBe(
      "https://example.com/office/converter/from-file?shardkey=Khirz6zTPdfd7",
    );
  });

  it("sends the request as the JSON of a params part, the file after it", async () => {
    const { fetch, calls } = spyFetch();
    const request: ConvertFileRequest = {
      ...docx,
      async: true,
      codePage: 65001,
      pdf: { form: true },
      title: "Contract.docx",
      watermark: { fill: [255, 0, 0] },
    };

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(request, new Blob([bytes]));

    const form = formOf(calls[0]);

    expect(form).toBeInstanceOf(FormData);
    expect([...form.keys()]).toEqual(["params", "file"]);
    expect(JSON.parse(form.get("params") as string)).toEqual(request);
  });

  it("sends the file under its own name", async () => {
    const { fetch, calls } = spyFetch();
    const file = new File([bytes], "Q3 Report.docx");

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, file);

    const sent = formOf(calls[0]).get("file") as File;

    expect(sent.name).toBe("Q3 Report.docx");
    await expect(sent.arrayBuffer().then((b) => new Uint8Array(b))).resolves.toEqual(bytes);
  });

  it("names a file that has no name of its own by the extension it is converted from", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect((formOf(calls[0]).get("file") as File).name).toBe("document.docx");
  });

  it("leaves the content type of the form to fetch", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "Content-Type": "application/json", "x-tenant": "acme" },
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect(headerOf(calls[0], "content-type")).toBeNull();
    expect(headerOf(calls[0], "accept")).toBeNull();
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]), "header.token");

    expect(headerOf(calls[0], "authorization")).toBe("Bearer header.token");
  });

  it("follows a configured header name and prefix", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      authorizationHeader: "X-Docs-Token",
      authorizationPrefix: "",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]), "header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends a token of the body within the params", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile({ ...docx, token: "body.token" }, new Blob([bytes]));

    const form = formOf(calls[0]);

    expect(JSON.parse(form.get("params") as string)).toMatchObject({ token: "body.token" });
    expect(form.has("token")).toBe(false);
  });

  it("does not modify the request it was given", async () => {
    const { fetch } = spyFetch();
    const request: ConvertFileRequest = { ...docx, pdf: { form: true } };

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(request, new Blob([bytes]));

    expect(request).toEqual({ ...docx, pdf: { form: true } });
  });

  it("calls the deadline off once the response has arrived", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(calls[0]?.init?.signal?.aborted).toBe(false);
  });

  it("times out on a conversion that never answers", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch: hangingFetch,
    });

    await expect(client.raw.convertFromFile(docx, new Blob([bytes]))).rejects.toThrow(
      DocumentServerTimeoutError,
    );
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("Bad Request", { status: 400 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.convertFromFile(docx, new Blob([bytes]));

    expect(response.status).toBe(400);
  });
});

describe("convertFromFile", () => {
  const docx: ConvertFileRequest = { filetype: "docx", key: "Khirz6zTPdfd7", outputtype: "pdf" };

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("answers with the converted file, unread", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result = await client(
      () =>
        new Response(pdf, {
          headers: {
            "content-disposition": 'inline; filename="Contract.pdf"',
            "content-type": "application/pdf",
          },
        }),
    ).convertFromFile(docx, new Blob(["docx"]));

    expect(result.endConvert).toBe(true);
    if (!result.endConvert) return;

    expect(result.file.bodyUsed).toBe(false);
    expect(result.file.headers.get("content-disposition")).toBe('inline; filename="Contract.pdf"');
    await expect(result.file.arrayBuffer().then((b) => new Uint8Array(b))).resolves.toEqual(pdf);
  });

  it("takes a file whose type says nothing as the file", async () => {
    const result = await client(() => new Response(new Uint8Array([1, 2]))).convertFromFile(
      docx,
      new Blob(["docx"]),
    );

    expect(result.endConvert).toBe(true);
  });

  it("answers with the progress of an async conversion that is still running", async () => {
    const result = await client(() =>
      Response.json({ percent: 40, endConvert: false }),
    ).convertFromFile({ ...docx, async: true }, new Blob(["docx"]));

    expect(result).toEqual({ endConvert: false, percent: 40 });
  });

  it("reads JSON whatever charset it is labelled with", async () => {
    const result = await client(
      () =>
        new Response('{"percent":0,"endConvert":false}', {
          headers: { "content-type": "Application/JSON; charset=UTF-8" },
        }),
    ).convertFromFile({ ...docx, async: true }, new Blob(["docx"]));

    expect(result).toEqual({ endConvert: false, percent: 0 });
  });

  it("throws the code of a failed conversion", async () => {
    const failed = client(() => Response.json({ error: -5 }));

    await expect(failed.convertFromFile(docx, new Blob(["docx"]))).rejects.toThrow(ConversionError);
    await expect(failed.convertFromFile(docx, new Blob(["docx"]))).rejects.toMatchObject({
      kind: "conversion",
      code: -5,
    });
  });

  it("refuses JSON that neither carries a code nor reports progress", async () => {
    const odd = client(() => Response.json({ endConvert: true, fileUrl: "https://x/y.pdf" }));

    await expect(odd.convertFromFile(docx, new Blob(["docx"]))).rejects.toThrow(
      DocumentServerParseError,
    );
  });

  it("throws on a failing status", async () => {
    const failed = client(() => new Response("Bad Gateway", { status: 502 }));

    await expect(failed.convertFromFile(docx, new Blob(["docx"]))).rejects.toMatchObject({
      kind: "http",
      status: 502,
      body: "Bad Gateway",
    });
  });
});

describe("raw.docbuilderFromFile", () => {
  const script = new Uint8Array([0x62, 0x75, 0x69, 0x6c]);

  /** Reads the form back off a recorded call. */
  function formOf(call: RecordedCall | undefined): FormData {
    return call?.init?.body as FormData;
  }

  it("posts the request to /docbuilder/from-file", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder/from-file");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://example.com/office/",
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect(calls[0]?.url).toBe("https://example.com/office/docbuilder/from-file");
  });

  it("sends the request as the JSON of a params part, the script after it", async () => {
    const { fetch, calls } = spyFetch();
    const request: BuildFileRequest = { async: true, argument: { name: "Contract" } };

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile(request, new Blob([script]));

    const form = formOf(calls[0]);

    expect([...form.keys()]).toEqual(["params", "file"]);
    expect(JSON.parse(form.get("params") as string)).toEqual(request);
  });

  it("sends an empty request as an empty params part", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect(formOf(calls[0]).get("params")).toBe("{}");
  });

  it("sends the script under its own name", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({}, new File([script], "report.docbuilder"));

    const sent = formOf(calls[0]).get("file") as File;

    expect(sent.name).toBe("report.docbuilder");
    await expect(sent.arrayBuffer().then((b) => new Uint8Array(b))).resolves.toEqual(script);
  });

  it("names a script that has no name of its own script.docbuilder", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect((formOf(calls[0]).get("file") as File).name).toBe("script.docbuilder");
  });

  it("leaves the content type of the form to fetch", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "Content-Type": "application/json", "x-tenant": "acme" },
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect(headerOf(calls[0], "content-type")).toBeNull();
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends the token in an authorization header, and none without one", async () => {
    const { fetch, calls } = spyFetch();
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch });

    await client.raw.docbuilderFromFile({}, new Blob([script]), "header.token");
    await client.raw.docbuilderFromFile({}, new Blob([script]));

    expect(headerOf(calls[0], "authorization")).toBe("Bearer header.token");
    expect(headerOf(calls[1], "authorization")).toBeNull();
  });

  it("sends a token of the body within the params", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({ token: "body.token" }, new Blob([script]));

    const form = formOf(calls[0]);

    expect(JSON.parse(form.get("params") as string)).toEqual({ token: "body.token" });
    expect(form.has("token")).toBe(false);
  });

  it("times out on a build that never answers", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch: hangingFetch,
    });

    await expect(client.raw.docbuilderFromFile({}, new Blob([script]))).rejects.toThrow(
      DocumentServerTimeoutError,
    );
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("Bad Request", { status: 400 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).raw.docbuilderFromFile({}, new Blob([script]));

    expect(response.status).toBe(400);
  });
});

describe("docbuilderFromFile", () => {
  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses a finished build", async () => {
    const body: BuilderResponse = {
      key: "bld_1b0f090d89e47d44",
      end: true,
      urls: { "output.docx": "https://docs.example.com/output.docx" },
    };

    await expect(
      client(() => Response.json(body)).docbuilderFromFile({}, new Blob(["script"])),
    ).resolves.toEqual(body);
  });

  it("returns the key of a build that is still running", async () => {
    const body: BuilderResponse = { key: "bld_1b0f090d89e47d44", end: false };

    await expect(
      client(() => Response.json(body)).docbuilderFromFile({ async: true }, new Blob(["script"])),
    ).resolves.toEqual(body);
  });

  it("throws on an error code the service answered 200 with", async () => {
    const failing = client(() => Response.json({ error: -3 }));

    await expect(failing.docbuilderFromFile({}, new Blob(["script"]))).rejects.toThrow(
      BuilderError,
    );
    await expect(failing.docbuilderFromFile({}, new Blob(["script"]))).rejects.toMatchObject({
      kind: "builder",
      code: -3,
    });
  });

  it("throws on a failing status", async () => {
    await expect(
      client(() => new Response("Bad Request", { status: 400 })).docbuilderFromFile(
        {},
        new Blob(["script"]),
      ),
    ).rejects.toMatchObject({ kind: "http", status: 400, body: "Bad Request" });
  });
});

describe("getFile", () => {
  const path = "/cache/files/data/conv_key/output.pdf/output.pdf";

  it("sends GET to the path it was given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(path);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`https://docs.example.com${path}`);
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).getFile(path);

    expect(calls[0]?.url).toBe(`https://example.com/office${path}`);
  });

  it("appends the query it was given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(path, {
      md5: "Zm9vYmFy",
      expires: "1735689600",
      filename: "output.pdf",
    });

    expect(calls[0]?.url).toBe(
      `https://docs.example.com${path}?md5=Zm9vYmFy&expires=1735689600&filename=output.pdf`,
    );
  });

  it("appends the query to one the path already carries", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(
      `${path}?md5=Zm9vYmFy`,
      { filename: "output.pdf" },
    );

    expect(calls[0]?.url).toBe(`https://docs.example.com${path}?md5=Zm9vYmFy&filename=output.pdf`);
  });

  it("escapes the query it was given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(path, {
      filename: "report Q1&Q2.pdf",
    });

    expect(calls[0]?.url).toBe(`https://docs.example.com${path}?filename=report%20Q1%26Q2.pdf`);
  });

  it("sends no query string when it was given none", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(path);

    expect(calls[0]?.url).not.toContain("?");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).getFile(path);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body, no JSON headers and no authorization", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(path);

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "content-type")).toBeNull();
    expect(headerOf(calls[0], "accept")).toBeNull();
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("applies the per-request options", async () => {
    const { fetch, calls } = spyFetch();
    const controller = new AbortController();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFile(
      path,
      undefined,
      { headers: { "x-request-id": "42" }, signal: controller.signal, timeoutMs: 120_000 },
    );

    expect(headerOf(calls[0], "x-request-id")).toBe("42");
    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("times out on a hung download", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch: hangingFetch,
    });

    await expect(client.getFile(path)).rejects.toThrow(DocumentServerTimeoutError);
  });

  it("returns the response unread", async () => {
    const body = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const { fetch } = spyFetch(
      () => new Response(body, { headers: { "content-type": "application/pdf" } }),
    );

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).getFile(path);

    expect(response.bodyUsed).toBe(false);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    await expect(response.arrayBuffer().then((b) => new Uint8Array(b))).resolves.toEqual(body);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).getFile(path);

    expect(calls).toHaveLength(1);
  });

  it("calls the deadline off once the response has arrived", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch,
    }).getFile(path);

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(calls[0]?.init?.signal?.aborted).toBe(false);
  });

  it("leaves the caller signal armed once the deadline is off", async () => {
    const { fetch, calls } = spyFetch();
    const controller = new AbortController();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 5,
      fetch,
    }).getFile(path, undefined, { signal: controller.signal });

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(calls[0]?.init?.signal?.aborted).toBe(false);

    controller.abort();
    expect(calls[0]?.init?.signal?.aborted).toBe(true);
  });
});

describe("timeout validation", () => {
  const invalid: [string, number][] = [
    ["zero", 0],
    ["negative", -1],
    ["fractional", 1.5],
    ["not a number", Number.NaN],
    ["infinite", Number.POSITIVE_INFINITY],
    ["past the timer maximum", 2_147_483_648],
  ];

  it.each(invalid)("throws in the constructor on a %s timeout", (_name, timeoutMs) => {
    expect(
      () => new DocumentServerClient({ baseUrl: "https://docs.example.com", timeoutMs }),
    ).toThrow(TypeError);
  });

  it("names the offending value", () => {
    expect(
      () => new DocumentServerClient({ baseUrl: "https://docs.example.com", timeoutMs: 1.5 }),
    ).toThrow("timeoutMs must be an integer from 1 to 2147483647, got: 1.5");
  });

  it("accepts the bounds of the range", () => {
    for (const timeoutMs of [1, MAX_TIMEOUT_MS]) {
      expect(
        new DocumentServerClient({ baseUrl: "https://docs.example.com", timeoutMs }).options
          .timeoutMs,
      ).toBe(timeoutMs);
    }
  });

  it.each(invalid)("rejects a per-request %s timeout", async (_name, timeoutMs) => {
    const { fetch, calls } = spyFetch();
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch });

    await expect(client.raw.healthcheck({ timeoutMs })).rejects.toThrow(TypeError);
    await expect(
      client.getFile("/cache/files/output.pdf", undefined, { timeoutMs }),
    ).rejects.toThrow(TypeError);
    expect(calls).toHaveLength(0);
  });
});

describe("request options", () => {
  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };

  it("exposes the request options type to consumers", () => {
    // Compile-time guard: typecheck fails if RequestOptions stops being exported.
    const options: RequestOptions = { timeoutMs: 1234 };

    expect(options.timeoutMs).toBe(1234);
  });

  it("adds its headers to the configured ones on healthcheck", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.healthcheck({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("adds its headers to the configured ones on getConfig", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.getConfig({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("adds its headers to the configured ones on getFormats", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.getFormats({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("replaces a configured header whatever case it was written in", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.healthcheck({ headers: { "X-Tenant": "globex" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("globex");
  });

  it("keeps the headers convert sets of its own", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.convert(docx, "jwt.header.token", { headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "content-type")).toBe("application/json");
    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("keeps the headers command sets of its own", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.command({ c: "version" }, "jwt.header.token", { headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "content-type")).toBe("application/json");
    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("keeps the headers docbuilder sets of its own", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).raw.docbuilder({ url: "https://example.com/script.js" }, "jwt.header.token", {
      headers: { "x-request-id": "r-1" },
    });

    expect(headerOf(calls[0], "content-type")).toBe("application/json");
    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("lets a request header override the authorization convert built", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.convert(
      docx,
      "jwt.header.token",
      { headers: { authorization: "Bearer override" } },
    );

    expect(headerOf(calls[0], "authorization")).toBe("Bearer override");
  });

  it("takes its timeout over the configured one", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 60_000,
      fetch: hangingFetch,
    });

    await expect(client.raw.healthcheck({ timeoutMs: 20 })).rejects.toThrow(
      DocumentServerTimeoutError,
    );
  });

  it("aborts on the signal it was given", async () => {
    const controller = new AbortController();
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: hangingFetch,
    });

    const response = client.raw.convert(docx, undefined, { signal: controller.signal });

    controller.abort(new Error("cancelled by the caller"));

    await expect(response).rejects.toThrow("cancelled by the caller");
  });

  it("hands fetch an aborted signal when the caller's has already fired", async () => {
    const { fetch, calls } = spyFetch();
    const reason = new Error("cancelled before the call");

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).raw.healthcheck({
      signal: AbortSignal.abort(reason),
    });

    expect(calls[0]?.init?.signal?.aborted).toBe(true);
    expect(calls[0]?.init?.signal?.reason).toBe(reason);
  });

  it("still honours the timeout while a signal is watched", async () => {
    const controller = new AbortController();
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.raw.healthcheck({ signal: controller.signal })).rejects.toThrow(
      DocumentServerTimeoutError,
    );
  });
});

describe("a request that gets no answer", () => {
  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };
  const info: CommandRequest = { c: "info", key: "Khirz6zTPdfd7" };

  /** What Node's fetch rejects with when nothing listens on the port. */
  function refused(): TypeError {
    const cause = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:80"), {
      code: "ECONNREFUSED",
    });

    return new TypeError("fetch failed", { cause });
  }

  function failing(error: Error): ClientOptions["fetch"] {
    return () => Promise.reject(error);
  }

  /** A response whose body breaks off with the given error once it is read. */
  function broken(error: unknown): () => Response {
    return () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(error);
          },
        }),
      );
  }

  it("rejects with a network error when the server cannot be reached", async () => {
    const error = refused();
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: failing(error),
    });

    const rejection = client.getFormats().catch((caught: unknown) => caught);

    await expect(rejection).resolves.toBeInstanceOf(DocumentServerNetworkError);
    await expect(rejection).resolves.toMatchObject({
      kind: "network",
      url: "https://docs.example.com/meta/formats",
      response: undefined,
      cause: error,
      message:
        "the document server could not be reached at https://docs.example.com/meta/formats: " +
        "fetch failed (ECONNREFUSED)",
    });
  });

  it("rejects the same way from the raw client", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: failing(refused()),
    });

    await expect(client.raw.healthcheck()).rejects.toThrow(DocumentServerNetworkError);
  });

  it("falls back on the message under the reason when it carries no code", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: failing(new TypeError("fetch failed", { cause: new Error("bad port") })),
    });

    await expect(client.getConfig()).rejects.toThrow(
      "the document server could not be reached at https://docs.example.com/meta/config: fetch failed (bad port)",
    );
  });

  it("gives the reason alone when nothing lies under it", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: failing(new TypeError("fetch failed")),
    });

    await expect(client.getConfig()).rejects.toThrow(
      "the document server could not be reached at https://docs.example.com/meta/config: fetch failed",
    );
  });

  it("leaves the query out of the url", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: failing(refused()),
    });

    await expect(
      client.getFile("/cache/files/data/key/output.pdf", { md5: "secret", expires: "1" }),
    ).rejects.toMatchObject({ url: "https://docs.example.com/cache/files/data/key/output.pdf" });
  });

  it("rejects with a timeout error carrying the deadline", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 60_000,
      fetch: hangingFetch,
    });

    const rejection = client.convert(docx, undefined, { timeoutMs: 20 });

    await expect(rejection).rejects.toThrow(DocumentServerTimeoutError);
    await expect(rejection).rejects.toMatchObject({
      kind: "timeout",
      timeoutMs: 20,
      url: "https://docs.example.com/converter",
      response: undefined,
      cause: { name: "TimeoutError" },
      message:
        "the document server did not answer at https://docs.example.com/converter within 20 ms",
    });
  });

  it("wraps a body that breaks off while it is read", async () => {
    const error = new TypeError("terminated");
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(broken(error)).fetch,
    });

    await expect(client.getFormats()).rejects.toThrow(DocumentServerNetworkError);
    await expect(client.getFormats()).rejects.toMatchObject({ cause: error });
    await expect(client.healthcheck()).rejects.toThrow(DocumentServerNetworkError);
  });

  it("wraps a deadline that runs out while the body is read", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 1_000,
      fetch: spyFetch(broken(new DOMException("aborted", "TimeoutError"))).fetch,
    });

    await expect(client.command(info)).rejects.toMatchObject({
      kind: "timeout",
      timeoutMs: 1_000,
    });
  });

  it("keeps the reason of a caller who cancelled", async () => {
    const reason = new Error("cancelled by the caller");
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: hangingFetch,
    });

    const controller = new AbortController();
    const rejection = client.getConfig({ signal: controller.signal });

    controller.abort(reason);

    await expect(rejection).rejects.toBe(reason);
  });

  it("keeps a deadline of the caller's own as theirs", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: hangingFetch,
    });

    const rejection = client.getConfig({ signal: AbortSignal.timeout(20) });

    await expect(rejection).rejects.toMatchObject({ name: "TimeoutError" });
    await expect(rejection).rejects.not.toThrow(DocumentServerTimeoutError);
  });

  it("still throws a bad timeout as it is", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: hangingFetch,
    });

    await expect(client.getConfig({ timeoutMs: 1.5 })).rejects.toThrow(TypeError);
    await expect(client.getConfig({ timeoutMs: 1.5 })).rejects.not.toThrow(
      DocumentServerNetworkError,
    );
  });
});

describe("the url of an error", () => {
  /** Answers the way fetch does: the response carries the url it was fetched from. */
  function answering(respond: () => Response): ClientOptions["fetch"] {
    return (url) => {
      const response = respond();

      Object.defineProperty(response, "url", { value: url });

      return Promise.resolve(response);
    };
  }

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: answering(respond),
    });
  }

  it("names the server that answered with a failing status", async () => {
    const rejection = client(() => new Response("down", { status: 503 })).getFormats();

    await expect(rejection).rejects.toMatchObject({
      url: "https://docs.example.com/meta/formats",
      message: "the document server answered 503 at https://docs.example.com/meta/formats: down",
    });
  });

  it("leaves the query out of it", async () => {
    const rejection = client(() => new Response("", { status: 404 })).getFile(
      "/cache/files/data/key/output.pdf",
      { md5: "secret", expires: "1" },
    );

    await expect(rejection).rejects.toMatchObject({
      url: "https://docs.example.com/cache/files/data/key/output.pdf",
      message:
        "the document server answered 404 at https://docs.example.com/cache/files/data/key/output.pdf",
    });
  });

  it("is on an unexpected body and on a failure the service reports", async () => {
    await expect(client(() => new Response("<html>")).getConfig()).rejects.toMatchObject({
      kind: "parse",
      url: "https://docs.example.com/meta/config",
    });
    await expect(
      client(() => Response.json({ error: 6 })).command({ c: "version" }),
    ).rejects.toMatchObject({ kind: "command", url: "https://docs.example.com/command" });
  });

  it("is empty when the response does not carry one", async () => {
    const rejection = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(() => new Response("down", { status: 503 })).fetch,
    }).getFormats();

    await expect(rejection).rejects.toMatchObject({
      url: "",
      message: "the document server answered 503: down",
    });
  });
});

describe("healthcheck", () => {
  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("answers true when the server says so", async () => {
    await expect(client(() => new Response("true")).healthcheck()).resolves.toBe(true);
  });

  it("ignores the whitespace around the answer", async () => {
    await expect(client(() => new Response(" true\n")).healthcheck()).resolves.toBe(true);
  });

  it("answers false on anything else", async () => {
    await expect(client(() => new Response("false")).healthcheck()).resolves.toBe(false);
    await expect(client(() => new Response("<html>")).healthcheck()).resolves.toBe(false);
  });

  it("answers false rather than throwing on a failing status", async () => {
    await expect(client(() => new Response("down", { status: 503 })).healthcheck()).resolves.toBe(
      false,
    );
  });

  it("still rejects when the request never completes", async () => {
    const hung = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(hung.healthcheck()).rejects.toThrow(DocumentServerTimeoutError);
  });
});

describe("getConfig", () => {
  const config: ConfigResponse = {
    authorization: { header: "Authorization", prefix: "Bearer " },
    urls: {
      api: "/web-apps/apps/api/documents/api.js",
      command: "/command",
      converter: "/converter",
      docbuilder: "/docbuilder",
    },
    limits: { maxFileSize: 104_857_600 },
    langs: ["en", "pt-PT", "zh-TW"],
  };

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses the body into the configuration", async () => {
    const result = await client(() => Response.json(config)).getConfig();

    expect(result).toEqual(config);
    expect(result.authorization.header).toBe("Authorization");
    expect(result.limits.maxFileSize).toBe(104_857_600);
  });

  it("throws on a failing status", async () => {
    const failing = client(() => new Response("not found", { status: 404 }));

    await expect(failing.getConfig()).rejects.toThrow(DocumentServerHttpError);
    await expect(failing.getConfig()).rejects.toMatchObject({ status: 404, body: "not found" });
  });

  it("names the status and the body it was given", async () => {
    const failing = client(() => new Response("gateway is down", { status: 502 }));

    await expect(failing.getConfig()).rejects.toThrow(
      "the document server answered 502: gateway is down",
    );
  });

  it("truncates a long error body", async () => {
    const failing = client(() => new Response("x".repeat(1000), { status: 500 }));

    await expect(failing.getConfig()).rejects.toMatchObject({ body: `${"x".repeat(512)}…` });
  });

  it("throws on a body that is not JSON", async () => {
    // A reverse proxy answering 200 with a page of its own is the case this guards.
    const html = client(() => new Response("<html>hello</html>"));

    await expect(html.getConfig()).rejects.toThrow(DocumentServerParseError);
    await expect(html.getConfig()).rejects.toThrow("is not JSON: <html>hello</html>");
  });

  it("keeps the parse failure as the cause", async () => {
    const html = client(() => new Response("<html>"));

    await expect(html.getConfig()).rejects.toMatchObject({
      cause: expect.any(SyntaxError) as unknown,
    });
  });

  it("throws on JSON that is not an object", async () => {
    await expect(client(() => Response.json([])).getConfig()).rejects.toThrow(
      DocumentServerParseError,
    );
    await expect(client(() => Response.json(null)).getConfig()).rejects.toThrow(
      "is not a JSON object: null",
    );
  });
});

describe("getFormats", () => {
  const formats: FormatsResponse = [
    {
      name: "docx",
      type: "word",
      actions: ["view", "edit"],
      convert: ["pdf", "txt"],
      mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    },
  ];

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses the body into the list of formats", async () => {
    const result = await client(() => Response.json(formats)).getFormats();

    expect(result).toEqual(formats);
    expect(result[0]?.type).toBe("word");
  });

  it("throws on JSON that is not an array", async () => {
    await expect(client(() => Response.json({ formats })).getFormats()).rejects.toThrow(
      "is not a JSON array",
    );
  });

  it("throws on a failing status", async () => {
    await expect(client(() => new Response("", { status: 404 })).getFormats()).rejects.toThrow(
      DocumentServerHttpError,
    );
  });
});

describe("convert", () => {
  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses a finished conversion", async () => {
    const body: ConvertResponse = {
      endConvert: true,
      fileType: "pdf",
      fileUrl: "https://docs.example.com/converted.pdf",
      percent: 100,
    };

    await expect(client(() => Response.json(body)).convert(docx)).resolves.toEqual(body);
  });

  it("returns the progress of an unfinished conversion", async () => {
    const body: ConvertResponse = { endConvert: false, percent: 20 };

    await expect(client(() => Response.json(body)).convert(docx)).resolves.toEqual(body);
  });

  it("throws on an error code the service answered 200 with", async () => {
    const failing = client(() => Response.json({ error: -5 }));

    await expect(failing.convert(docx)).rejects.toThrow(ConversionError);
    await expect(failing.convert(docx)).rejects.toMatchObject({ code: -5 });
    await expect(failing.convert(docx)).rejects.toThrow(
      "conversion failed with code -5: incorrect password",
    );
  });

  it("puts the error under the common base class", async () => {
    await expect(client(() => Response.json({ error: -8 })).convert(docx)).rejects.toThrow(
      DocumentServerError,
    );
  });

  it("carries the response the error was read from", async () => {
    const failing = client(() => Response.json({ error: -2 }));
    const error = await failing.convert(docx).then(
      () => undefined,
      (reason: unknown) => reason as ConversionError,
    );

    expect(error?.response.status).toBe(200);
  });

  it("names a code it does not know", async () => {
    await expect(client(() => Response.json({ error: -42 })).convert(docx)).rejects.toThrow(
      "conversion failed with code -42: unrecognized error code",
    );
  });

  it("throws on a failing status", async () => {
    await expect(
      client(() => new Response("bad request", { status: 400 })).convert(docx),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("command", () => {
  const info: CommandRequest = { c: "info", key: "Khirz6zTPdfd7" };

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses a successful command", async () => {
    const body: CommandResponse = { error: 0, key: "Khirz6zTPdfd7", users: ["6d5a81d0"] };

    await expect(client(() => Response.json(body)).command(info)).resolves.toEqual(body);
  });

  it("throws on a non-zero error code", async () => {
    const failing = client(() => Response.json({ error: 6 }));

    await expect(failing.command(info)).rejects.toThrow(CommandError);
    await expect(failing.command(info)).rejects.toMatchObject({ code: 6 });
    await expect(failing.command(info)).rejects.toThrow(
      "command failed with code 6: invalid token",
    );
  });

  it("hands back code 4 rather than throwing", async () => {
    const body: CommandResponse = { error: 4, key: "Khirz6zTPdfd7" };
    const nothing = client(() => Response.json(body));

    await expect(nothing.command({ c: "forcesave", key: "Khirz6zTPdfd7" })).resolves.toEqual(body);
  });

  it("throws on a failing status", async () => {
    await expect(client(() => new Response("", { status: 500 })).command(info)).rejects.toThrow(
      DocumentServerHttpError,
    );
  });
});

describe("docbuilder", () => {
  const script: BuilderRequest = { url: "https://example.com/script.js" };

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("parses a finished build", async () => {
    const body: BuilderResponse = {
      key: "af86C7e71Ca8",
      end: true,
      urls: { "output.docx": "https://docs.example.com/output.docx" },
    };

    await expect(client(() => Response.json(body)).docbuilder(script)).resolves.toEqual(body);
  });

  it("returns the key of a build that is still running", async () => {
    const body: BuilderResponse = { key: "af86C7e71Ca8", end: false };

    await expect(
      client(() => Response.json(body)).docbuilder({ async: true, ...script }),
    ).resolves.toEqual(body);
  });

  it("throws on an error code the service answered 200 with", async () => {
    const failing = client(() => Response.json({ error: -4 }));

    await expect(failing.docbuilder(script)).rejects.toThrow(BuilderError);
    await expect(failing.docbuilder(script)).rejects.toMatchObject({ code: -4 });
    await expect(failing.docbuilder(script)).rejects.toThrow(
      "build failed with code -4: error while downloading the script or a file it opens",
    );
  });

  it("throws on a failing status", async () => {
    await expect(
      client(() => new Response("", { status: 503 })).docbuilder(script),
    ).rejects.toThrow(DocumentServerHttpError);
  });
});

describe("the raw client underneath", () => {
  it("shares the options with the typed one", () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
    });

    expect(client.options).toBe(client.raw.options);
    expect(client.options.baseUrl).toBe("https://docs.example.com");
  });

  it("answers with the untouched response", async () => {
    const { fetch } = spyFetch(() => Response.json({ error: -8 }));
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch });

    const response = await client.raw.convert({
      filetype: "docx",
      key: "Khirz6zTPdfd7",
      outputtype: "pdf",
      url: "https://example.com/document.docx",
    });

    expect(response.ok).toBe(true);
    expect(response.bodyUsed).toBe(false);
  });
});

describe("getFile on a failing status", () => {
  const path = "/cache/files/data/conv_key/output.pdf/output.pdf";

  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  it("throws rather than handing back an error page as the file", async () => {
    const missing = client(() => new Response("<html>404</html>", { status: 404 }));

    await expect(missing.getFile(path)).rejects.toThrow(DocumentServerHttpError);
    await expect(missing.getFile(path)).rejects.toMatchObject({
      status: 404,
      body: "<html>404</html>",
    });
  });

  it("leaves the body of a successful response unread", async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const response = await client(() => new Response(bytes)).getFile(path);

    expect(response.bodyUsed).toBe(false);
    await expect(response.arrayBuffer().then((b) => new Uint8Array(b))).resolves.toEqual(bytes);
  });

  it("hands the failing response back on the raw client", async () => {
    const missing = client(() => new Response("", { status: 404 }));
    const response = await missing.raw.getFile(path);

    expect(response.status).toBe(404);
  });
});

describe("splitFileUrl", () => {
  const file = "/cache/files/data/key/output.docx/output.docx";

  it("takes the path of the public address off the location", () => {
    expect(
      splitFileUrl(
        `https://my-doc-server.com/some-path/office${file}?md5=Zm9v&expires=1735689600`,
        "https://my-doc-server.com/some-path/office/",
      ),
    ).toEqual({ path: file, query: { md5: "Zm9v", expires: "1735689600" } });
  });

  it("gives a path the client resolves against its own address", async () => {
    const { fetch, calls } = spyFetch();
    const client = new DocumentServerClient({ baseUrl: "https://192.168.6.10/some-path", fetch });
    const { path, query } = splitFileUrl(
      `https://my-doc-server.com/some-path/office${file}?md5=Zm9v`,
      "https://my-doc-server.com/some-path/office",
    );

    await client.getFile(path, query);

    expect(calls[0]?.url).toBe(`https://192.168.6.10/some-path${file}?md5=Zm9v`);
  });

  it("keeps the whole path when the public address has none", () => {
    expect(splitFileUrl(`https://docs.example.com${file}`, "https://docs.example.com").path).toBe(
      file,
    );
  });

  it("keeps the whole path of a location outside the public address", () => {
    expect(splitFileUrl(`http://localhost${file}`, "https://docs.example.com/office").path).toBe(
      file,
    );
  });

  it("takes off only a whole segment", () => {
    expect(
      splitFileUrl(
        "https://docs.example.com/office2/cache/files/a",
        "https://docs.example.com/office",
      ).path,
    ).toBe("/office2/cache/files/a");
  });

  it("decodes the query the way the document server reads it", () => {
    expect(
      splitFileUrl(
        `https://docs.example.com${file}?filename=%D0%9E%D1%82%D1%87%D1%91%D1%82+1.docx`,
        new URL("https://docs.example.com"),
      ).query,
    ).toEqual({ filename: "Отчёт 1.docx" });
  });

  it("refuses a location that is not an absolute URL", () => {
    expect(() => splitFileUrl(file, "https://docs.example.com")).toThrow(TypeError);
    expect(() => splitFileUrl(`https://docs.example.com${file}`, "/office")).toThrow(TypeError);
  });
});

describe("a zero error code", () => {
  function client(respond: () => Response) {
    return new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: spyFetch(respond).fetch,
    });
  }

  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };

  it("is no conversion failure", async () => {
    const body = { error: 0, endConvert: true, fileUrl: "https://docs.example.com/out.pdf" };

    await expect(client(() => Response.json(body)).convert(docx)).resolves.toEqual(body);
  });

  it("is no build failure", async () => {
    const body = {
      error: 0,
      end: true,
      urls: { "output.docx": "https://docs.example.com/o.docx" },
    };

    await expect(
      client(() => Response.json(body)).docbuilder({ url: "https://example.com/script.js" }),
    ).resolves.toEqual(body);
  });
});

describe("recognizing an error", () => {
  const response = new Response("", { status: 500 });

  const errors = {
    http: new DocumentServerHttpError(response, "down"),
    parse: new DocumentServerParseError("not JSON", response, "<html>"),
    conversion: new ConversionError(-5, response),
    command: new CommandError(6, response),
    builder: new BuilderError(-4, response),
    network: new DocumentServerNetworkError("https://docs.example.com/meta/formats", "down"),
    timeout: new DocumentServerTimeoutError("https://docs.example.com/converter", 20, "late"),
  };

  it("keeps instanceof working", () => {
    expect(errors.conversion).toBeInstanceOf(ConversionError);
    expect(errors.conversion).toBeInstanceOf(DocumentServerError);
    expect(errors.conversion).toBeInstanceOf(Error);
  });

  it("names the kind of failure it stands for", () => {
    expect(Object.entries(errors).map(([kind, error]) => [kind, error.kind])).toEqual(
      Object.keys(errors).map((kind) => [kind, kind]),
    );
  });

  it("takes every error of the SDK", () => {
    for (const error of Object.values(errors)) {
      expect(DocumentServerError.is(error)).toBe(true);
    }
  });

  it("tells one error of the SDK from another", () => {
    expect(ConversionError.is(errors.conversion)).toBe(true);
    expect(ConversionError.is(errors.command)).toBe(false);
    expect(CommandError.is(errors.command)).toBe(true);
    expect(BuilderError.is(errors.builder)).toBe(true);
    expect(DocumentServerHttpError.is(errors.http)).toBe(true);
    expect(DocumentServerParseError.is(errors.parse)).toBe(true);
    expect(DocumentServerParseError.is(errors.http)).toBe(false);
    expect(DocumentServerNetworkError.is(errors.network)).toBe(true);
    expect(DocumentServerNetworkError.is(errors.timeout)).toBe(false);
    expect(DocumentServerTimeoutError.is(errors.timeout)).toBe(true);
  });

  it.each([
    ["a plain error", new Error("nope")],
    ["a type error", new TypeError("nope")],
    ["an object", { kind: "conversion", code: -5 }],
    ["null", null],
    ["undefined", undefined],
    ["a string", "conversion failed"],
  ])("takes nothing else: %s", (_name, value) => {
    expect(DocumentServerError.is(value)).toBe(false);
    expect(ConversionError.is(value)).toBe(false);
  });

  it("takes an error thrown by a second copy of the package", () => {
    // A dual bundle hands the app two copies of the class, and instanceof knows
    // only the one it was compiled against.
    const brand = Symbol.for("@onlyoffice/docs-integration-sdk.error");

    class ForeignConversionError extends Error {
      readonly kind = "conversion";
      readonly code = -5;

      get [brand](): true {
        return true;
      }
    }

    const foreign = new ForeignConversionError();

    expect(foreign).not.toBeInstanceOf(ConversionError);
    expect(DocumentServerError.is(foreign)).toBe(true);
    expect(ConversionError.is(foreign)).toBe(true);
    expect(CommandError.is(foreign)).toBe(false);
  });

  it("narrows to the error of that kind", () => {
    const seen: string[] = [];

    for (const error of Object.values<unknown>(errors)) {
      if (!DocumentServerError.is(error)) continue;

      switch (error.kind) {
        case "http":
          seen.push(`http ${String(error.status)}`);
          break;
        case "parse":
          seen.push(`parse ${error.body}`);
          break;
        case "conversion":
        case "command":
        case "builder":
          seen.push(`${error.kind} ${String(error.code)}`);
          break;
        case "network":
          seen.push(`network ${error.url}`);
          break;
        case "timeout":
          seen.push(`timeout ${String(error.timeoutMs)}`);
          break;
      }
    }

    expect(seen).toEqual([
      "http 500",
      "parse <html>",
      "conversion -5",
      "command 6",
      "builder -4",
      "network https://docs.example.com/meta/formats",
      "timeout 20",
    ]);
  });
});

describe("an error code", () => {
  it("keeps the documented ones as literals", () => {
    // Compile-time guard: a widened union would make the cases unreachable.
    const name = (code: ConversionErrorCode): string => {
      switch (code) {
        case -5:
          return "incorrect password";
        case -8:
          return "invalid token";
        default:
          return "something else";
      }
    };

    expect([name(-5), name(-8), name(-42)]).toEqual([
      "incorrect password",
      "invalid token",
      "something else",
    ]);
  });

  it("takes one the service does not document", () => {
    // Compile-time guard: a strict union would reject every one of these.
    const conversion: ConversionErrorCode = -42;
    const command: CommandErrorCode = 9;
    const builder: BuilderErrorCode = -7;

    expect([conversion, command, builder]).toEqual([-42, 9, -7]);
  });

  it("reaches the error it was read from", () => {
    const { fetch } = spyFetch(() => Response.json({ error: 7 }));
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch });

    return expect(client.command({ c: "version" })).rejects.toMatchObject({
      code: 7,
      kind: "command",
      message: "command failed with code 7: unrecognized error code",
    });
  });
});
