import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DocumentServerClient,
  type ClientOptions,
  type ConvertRequest,
  type ConvertResponse,
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
    expect(typeof options.fetch).toBe("function");
  });

  it("keeps the values it was given", () => {
    const { fetch } = spyFetch();
    const { options } = new DocumentServerClient({
      baseUrl: "https://docs.example.com",
      timeoutMs: 1234,
      headers: { "x-tenant": "acme" },
      fetch,
    });

    expect(options.timeoutMs).toBe(1234);
    expect(options.headers).toEqual({ "x-tenant": "acme" });
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
    expect(calls[0]?.init?.headers).toEqual({ "x-tenant": "acme" });
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

    expect(calls[0]?.init?.headers).toEqual({ "x-tenant": "acme" });
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
