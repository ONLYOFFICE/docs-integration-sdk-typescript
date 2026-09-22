import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DocumentServerClient,
  type BuilderRequest,
  type BuilderResponse,
  type ClientOptions,
  type ConfigResponse,
  type Format,
  type CommandRequest,
  type CommandResponse,
  type ConvertRequest,
  type ConvertResponse,
  type RequestOptions,
} from "../src/index.js";

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

    await client.healthcheck();

    expect(client.options.baseUrl).toBe("https://docs.example.com");
    expect(client.options.timeoutMs).toBe(5000);
    expect(calls[0]?.url).toBe("https://docs.example.com/healthcheck");
    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });
});

describe("healthcheck", () => {
  it("sends GET to /healthcheck", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).healthcheck();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/healthcheck");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).healthcheck();

    expect(calls[0]?.url).toBe("https://example.com/office/healthcheck");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).healthcheck();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no JSON headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).healthcheck();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "content-type")).toBeNull();
    expect(headerOf(calls[0], "accept")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).healthcheck();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => new Response("true", { status: 200 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).healthcheck();

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("true");
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("down", { status: 503 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).healthcheck();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.healthcheck()).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).healthcheck();

    expect(calls).toHaveLength(1);
  });

  it("picks up a global fetch patched after construction", async () => {
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });
    const { fetch, calls } = spyFetch();

    vi.stubGlobal("fetch", fetch);
    await client.healthcheck();

    expect(calls).toHaveLength(1);
  });
});

describe("getConfig", () => {
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getConfig();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/meta/config");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).getConfig();

    expect(calls[0]?.url).toBe("https://example.com/office/meta/config");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).getConfig();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no authorization header", async () => {
    // The endpoint describes the server rather than a document, so it takes no token.
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getConfig();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "authorization")).toBeNull();
    expect(headerOf(calls[0], "content-type")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getConfig();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.getConfig()).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => Response.json(config));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).getConfig();

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<ConfigResponse>).resolves.toEqual(config);
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("", { status: 404 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).getConfig();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).getConfig();

    expect(calls).toHaveLength(1);
  });
});

describe("getFormats", () => {
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFormats();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/meta/formats");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).getFormats();

    expect(calls[0]?.url).toBe("https://example.com/office/meta/formats");
  });

  it("sends the configured headers", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).getFormats();

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no body and no authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFormats();

    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headerOf(calls[0], "authorization")).toBeNull();
    expect(headerOf(calls[0], "content-type")).toBeNull();
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).getFormats();

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.getFormats()).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("returns the response untouched", async () => {
    const { fetch } = spyFetch(() => Response.json(formats));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).getFormats();

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<Format[]>).resolves.toEqual(formats);
  });

  it("hands back a failing response instead of throwing", async () => {
    const { fetch } = spyFetch(() => new Response("", { status: 404 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).getFormats();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).getFormats();

    expect(calls).toHaveLength(1);
  });
});

describe("convert", () => {
  const docx: ConvertRequest = {
    filetype: "docx",
    key: "Khirz6zTPdfd7",
    outputtype: "pdf",
    url: "https://example.com/document.docx",
  };

  it("posts the request to /converter", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(docx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/converter?shardkey=Khirz6zTPdfd7");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the request as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert({
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(docx);

    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends the configured headers too", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).convert(docx);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("overrides a configured content type instead of merging with it", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "Content-Type": "text/plain" },
      fetch,
    }).convert(docx);

    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(docx);

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(
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
    }).convert(docx, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("overrides a configured authorization header instead of merging with it", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { Authorization: "Bearer stale" },
      fetch,
    }).convert(docx, "jwt.header.token");

    expect(headerOf(calls[0], "authorization")).toBe("Bearer jwt.header.token");
  });

  it("leaves the body signature to the caller", async () => {
    // The two tokens sign different payloads, so the header one never lands in the body.
    const { fetch, calls } = spyFetch();
    const request: ConvertRequest = { ...docx, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the request it was given", async () => {
    const { fetch } = spyFetch();
    const request: ConvertRequest = { ...docx };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(docx);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).convert(docx);

    expect(calls[0]?.url).toBe("https://example.com/office/converter?shardkey=Khirz6zTPdfd7");
  });

  it("pins the request to a shard with the document key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert({
      ...docx,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/converter?shardkey=a%20b%26c");
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(docx);

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.convert(docx)).rejects.toMatchObject({ name: "TimeoutError" });
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
    }).convert(docx);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<ConvertResponse>).resolves.toEqual(body);
  });

  it("hands back a conversion error instead of throwing", async () => {
    // The service answers 200 even when the conversion failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: -8 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).convert(docx);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<ConvertResponse>).resolves.toEqual({ error: -8 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).convert(docx);

    expect(calls).toHaveLength(1);
  });
});

describe("command", () => {
  const info: CommandRequest = { c: "info", key: "Khirz6zTPdfd7" };

  it("posts the command to /command", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(info);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/command?shardkey=Khirz6zTPdfd7");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the command as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command({
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(info);

    expect(headerOf(calls[0], "accept")).toBe("application/json");
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("sends the configured headers too", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).command(info);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(info);

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(
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
    }).command(info, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("leaves the body signature to the caller", async () => {
    const { fetch, calls } = spyFetch();
    const request: CommandRequest = { ...info, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the command it was given", async () => {
    const { fetch } = spyFetch();
    const request: CommandRequest = { ...info };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(info);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).command(info);

    expect(calls[0]?.url).toBe("https://example.com/office/command?shardkey=Khirz6zTPdfd7");
  });

  it("pins the command to a shard with the document key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command({
      ...info,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/command?shardkey=a%20b%26c");
  });

  it.each<CommandRequest>([{ c: "getForgottenList" }, { c: "license" }, { c: "version" }])(
    "sends no shardkey for a command without a key: %o",
    async (request) => {
      const { fetch, calls } = spyFetch();

      await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(
        request,
      );

      expect(calls[0]?.url).toBe("https://docs.example.com/command");
    },
  );

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).command(info);

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts once the timeout is reached", async () => {
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 20,
      fetch: hangingFetch,
    });

    await expect(client.command(info)).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("returns the response untouched", async () => {
    const body = { error: 0, key: "Khirz6zTPdfd7", users: ["6d5a81d0", "78e1e841"] };
    const { fetch } = spyFetch(() => Response.json(body));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).command(info);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<CommandResponse>).resolves.toEqual(body);
  });

  it("hands back a command error instead of throwing", async () => {
    // The service answers 200 even when the command failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: 6 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).command(info);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<CommandResponse>).resolves.toEqual({ error: 6 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).command(info);

    expect(calls).toHaveLength(1);
  });
});

describe("docbuilder", () => {
  const script: BuilderRequest = { url: "https://example.com/script.js" };

  it("posts the request to /docbuilder", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
      script,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder");
    expect(calls[0]?.init?.method).toBe("POST");
  });

  it("sends the request as a JSON body", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder({
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
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
    }).docbuilder(script);

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
  });

  it("sends no authorization header when no token is given", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
      script,
    );

    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("sends the token in an authorization header", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
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
    }).docbuilder(script, "jwt.header.token");

    expect(headerOf(calls[0], "x-docs-token")).toBe("jwt.header.token");
    expect(headerOf(calls[0], "authorization")).toBeNull();
  });

  it("leaves the body signature to the caller", async () => {
    const { fetch, calls } = spyFetch();
    const request: BuilderRequest = { ...script, token: "jwt.body.token" };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
      request,
      "jwt.header.token",
    );

    expect(bodyOf(calls[0])).toMatchObject({ token: "jwt.body.token" });
  });

  it("does not modify the request it was given", async () => {
    const { fetch } = spyFetch();
    const request: BuilderRequest = { ...script };

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
      request,
      "jwt.header.token",
    );

    expect(request).toEqual(script);
  });

  it("keeps the path prefix of the base URL", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://example.com/office/", fetch }).docbuilder(
      script,
    );

    expect(calls[0]?.url).toBe("https://example.com/office/docbuilder");
  });

  it("pins a poll to a shard with the build key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder({
      async: true,
      key: "a b&c",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder?shardkey=a%20b%26c");
  });

  it("sends no shardkey before the service has minted a key", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder({
      async: true,
      url: "https://example.com/script.js",
    });

    expect(calls[0]?.url).toBe("https://docs.example.com/docbuilder");
  });

  it("passes an abort signal", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).docbuilder(
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

    await expect(client.docbuilder(script)).rejects.toMatchObject({ name: "TimeoutError" });
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
    }).docbuilder(script);

    expect(response.status).toBe(200);
    await expect(response.json() as Promise<BuilderResponse>).resolves.toEqual(body);
  });

  it("hands back a build error instead of throwing", async () => {
    // The service answers 200 even when the build failed, so only the body tells.
    const { fetch } = spyFetch(() => Response.json({ error: -8 }));

    const response = await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch,
    }).docbuilder(script);

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<BuilderResponse>).resolves.toEqual({ error: -8 });
  });

  it("falls back to the global fetch", async () => {
    const { fetch, calls } = spyFetch();
    vi.stubGlobal("fetch", fetch);

    await new DocumentServerClient({ baseUrl: "https://docs.example.com" }).docbuilder(script);

    expect(calls).toHaveLength(1);
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

    await expect(client.getFile(path)).rejects.toThrow("The operation was aborted due to timeout");
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
    }).healthcheck({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("adds its headers to the configured ones on getConfig", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).getConfig({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("adds its headers to the configured ones on getFormats", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).getFormats({ headers: { "x-request-id": "r-1" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("acme");
    expect(headerOf(calls[0], "x-request-id")).toBe("r-1");
  });

  it("replaces a configured header whatever case it was written in", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).healthcheck({ headers: { "X-Tenant": "globex" } });

    expect(headerOf(calls[0], "x-tenant")).toBe("globex");
  });

  it("keeps the headers convert sets of its own", async () => {
    const { fetch, calls } = spyFetch();

    await new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      headers: { "x-tenant": "acme" },
      fetch,
    }).convert(docx, "jwt.header.token", { headers: { "x-request-id": "r-1" } });

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
    }).command({ c: "version" }, "jwt.header.token", { headers: { "x-request-id": "r-1" } });

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
    }).docbuilder({ url: "https://example.com/script.js" }, "jwt.header.token", {
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

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).convert(
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

    await expect(client.healthcheck({ timeoutMs: 20 })).rejects.toMatchObject({
      name: "TimeoutError",
    });
  });

  it("aborts on the signal it was given", async () => {
    const controller = new AbortController();
    const client = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      fetch: hangingFetch,
    });

    const response = client.convert(docx, undefined, { signal: controller.signal });

    controller.abort(new Error("cancelled by the caller"));

    await expect(response).rejects.toThrow("cancelled by the caller");
  });

  it("hands fetch an aborted signal when the caller's has already fired", async () => {
    const { fetch, calls } = spyFetch();
    const reason = new Error("cancelled before the call");

    await new DocumentServerClient({ baseUrl: "https://docs.example.com", fetch }).healthcheck({
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

    await expect(client.healthcheck({ signal: controller.signal })).rejects.toMatchObject({
      name: "TimeoutError",
    });
  });
});
