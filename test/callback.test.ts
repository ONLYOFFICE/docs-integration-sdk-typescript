import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  type CallbackBody,
  CallbackError,
  type CallbackEvent,
  type CallbackVerifier,
  DocumentServerCallback,
  DocumentServerJwt,
  JwtError,
} from "../src/index.js";

const jwt = new DocumentServerJwt({ secret: "secret" });

const save: CallbackBody = {
  key: "Khirz6zTPdfd7",
  status: 2,
  url: "https://docs.example.com/cache/files/Khirz6zTPdfd7/output.docx",
  filetype: "docx",
  users: ["u-17"],
  actions: [{ type: 0, userid: "u-17" }],
};

function body(overrides: Partial<CallbackBody> = {}): CallbackBody {
  return { ...save, ...overrides };
}

function withoutUrl(overrides: Partial<CallbackBody>): Partial<CallbackBody> {
  const rest: Partial<CallbackBody> = body(overrides);

  delete rest.url;

  return rest;
}

async function parse(
  input: Parameters<typeof DocumentServerCallback.parse>[0],
): Promise<CallbackEvent> {
  return (await DocumentServerCallback.parse(input, { verifier: jwt })).event;
}

async function refusal(promise: Promise<unknown>): Promise<CallbackError> {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(CallbackError.is(error)).toBe(true);

  return error as CallbackError;
}

describe("DocumentServerCallback", () => {
  it.each([
    [1, "editing"],
    [2, "save"],
    [3, "save-error"],
    [4, "closed"],
    [6, "forcesave"],
    [7, "forcesave-error"],
  ] as const)("tells status %i apart as %s", (status, kind) => {
    const { event } = new DocumentServerCallback(body({ status }));

    expect(event.kind).toBe(kind);
    expect(event.status).toBe(status);
  });

  it("tells a status it does not know yet apart as unknown", () => {
    const { event } = new DocumentServerCallback(body({ status: 9 }));

    expect(event).toMatchObject({ kind: "unknown", status: 9 });
  });

  it("keeps every field of the body as the document server named it", () => {
    const { event } = new DocumentServerCallback(save);

    expect(event).toEqual({ ...save, kind: "save" });
  });

  it("freezes the event", () => {
    expect(Object.isFrozen(new DocumentServerCallback(save).event)).toBe(true);
  });

  it("narrows the event by its kind", () => {
    const { event } = new DocumentServerCallback(save);

    if (event.kind === "save") {
      expectTypeOf(event.url).toEqualTypeOf<string>();
    }
  });

  it("refuses a body that is not an object", () => {
    expect(() => new DocumentServerCallback([])).toThrow(/must be an object, got: object/);
    expect(() => new DocumentServerCallback(null)).toThrow(/must be an object, got: null/);
  });

  it("refuses a body without a key", () => {
    expect(() => new DocumentServerCallback(body({ key: "" }))).toThrow(/carries no key/);
  });

  it("refuses a status that is not an integer", () => {
    expect(() => new DocumentServerCallback(body({ status: 2.5 }))).toThrow(
      /status of the callback must be an integer/,
    );
  });

  it.each([2, 6])("refuses a callback of status %i without a url", (status) => {
    expect(() => new DocumentServerCallback(withoutUrl({ status }))).toThrow(/carries no url/);
  });

  it("takes a save error without a url", () => {
    expect(new DocumentServerCallback(withoutUrl({ status: 3 })).event.kind).toBe("save-error");
  });

  it("refuses with a CallbackError of kind body", () => {
    expect.assertions(2);

    try {
      new DocumentServerCallback({});
    } catch (error) {
      expect(error).toBeInstanceOf(CallbackError);
      expect(error).toMatchObject({ kind: "body", name: "CallbackError" });
    }
  });
});

describe("DocumentServerCallback.parse, the token in the body", () => {
  it("takes the callback the token carries", async () => {
    const event = await parse({ body: { ...save, token: await jwt.sign(save) } });

    expect(event).toMatchObject({ ...save, kind: "save" });
  });

  it("trusts the token rather than the body it came in", async () => {
    const forged = { ...save, url: "https://attacker.example.com/file.docx" };
    const event = await parse({ body: { ...forged, token: await jwt.sign(save) } });

    expect(event).toMatchObject({ url: save.url });
  });

  it("reads a body that came in as text", async () => {
    const text = JSON.stringify({ ...save, token: await jwt.sign(save) });

    expect(await parse({ body: text })).toMatchObject({ kind: "save" });
  });

  it("reads a body that came in as bytes", async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ ...save, token: await jwt.sign(save) }),
    );

    expect(await parse({ body: bytes })).toMatchObject({ kind: "save" });
  });

  it("checks the token in the body before the one in the header", async () => {
    const header = await jwt.sign({ payload: body({ status: 4 }) });
    const event = await parse({
      body: { ...save, token: await jwt.sign(save) },
      headers: { authorization: `Bearer ${header}` },
    });

    expect(event.kind).toBe("save");
  });

  it("refuses a body that is not JSON", async () => {
    const error = await refusal(parse({ body: "{ not json" }));

    expect(error.kind).toBe("body");
  });
});

describe("DocumentServerCallback.parse, the token in the header", () => {
  it("takes the payload the token carries", async () => {
    const token = await jwt.sign({ payload: save });
    const event = await parse({ body: save, headers: { Authorization: `Bearer ${token}` } });

    expect(event).toMatchObject({ ...save, kind: "save" });
  });

  it("trusts the payload rather than the body it came with", async () => {
    const token = await jwt.sign({ payload: save });
    const event = await parse({
      body: { ...save, url: "https://attacker.example.com/file.docx" },
      headers: { authorization: `Bearer ${token}` },
    });

    expect(event).toMatchObject({ url: save.url });
  });

  it("finds the header whatever its case", async () => {
    const token = await jwt.sign({ payload: save });
    const event = await parse({ body: save, headers: { AUTHORIZATION: `Bearer ${token}` } });

    expect(event.kind).toBe("save");
  });

  it("reads the Headers of fetch", async () => {
    const token = await jwt.sign({ payload: save });
    const event = await parse({
      body: save,
      headers: new Headers({ Authorization: `Bearer ${token}` }),
    });

    expect(event.kind).toBe("save");
  });

  it("reads the first of a header given twice", async () => {
    const token = await jwt.sign({ payload: save });
    const event = await parse({
      body: save,
      headers: { authorization: [`Bearer ${token}`, "Bearer other"] },
    });

    expect(event.kind).toBe("save");
  });

  it("takes a header and a prefix of its own", async () => {
    const token = await jwt.sign({ payload: save });
    const { event } = await DocumentServerCallback.parse(
      { body: save, headers: { "x-docs-token": `Token ${token}` } },
      { verifier: jwt, authorizationHeader: "X-Docs-Token", authorizationPrefix: "Token " },
    );

    expect(event.kind).toBe("save");
  });

  it("refuses a token whose payload is not a callback", async () => {
    const token = await jwt.sign({ key: save.key });
    const error = await refusal(
      parse({ body: save, headers: { authorization: `Bearer ${token}` } }),
    );

    expect(error.kind).toBe("body");
  });
});

describe("DocumentServerCallback.parse, refusals", () => {
  it("refuses a callback without a token when a verifier requires one", async () => {
    const error = await refusal(parse({ body: save }));

    expect(error.kind).toBe("token");
  });

  it("refuses a callback whose headers carry no token", async () => {
    const error = await refusal(
      parse({ body: save, headers: { "content-type": "application/json" } }),
    );

    expect(error.kind).toBe("token");
  });

  it("refuses a header without the prefix", async () => {
    const token = await jwt.sign({ payload: save });
    const error = await refusal(parse({ body: save, headers: { authorization: token } }));

    expect(error.kind).toBe("token");
  });

  it("refuses a header with the prefix and no token", async () => {
    const error = await refusal(parse({ body: save, headers: { authorization: "Bearer " } }));

    expect(error.kind).toBe("token");
  });

  it("refuses a token signed with another secret, with the refusal as its cause", async () => {
    const other = new DocumentServerJwt({ secret: "other" });
    const error = await refusal(parse({ body: { ...save, token: await other.sign(save) } }));

    expect(error.kind).toBe("signature");
    expect(JwtError.is(error.cause)).toBe(true);
  });
});

describe("DocumentServerCallback.parse, no verifier", () => {
  it("takes an unsigned callback", async () => {
    const { event } = await DocumentServerCallback.parse({ body: save }, { verifier: null });

    expect(event).toMatchObject({ ...save, kind: "save" });
  });

  it("leaves a token it carries unchecked", async () => {
    const { event } = await DocumentServerCallback.parse(
      { body: { ...save, token: "not.a.token" } },
      { verifier: null },
    );

    expect(event.kind).toBe("save");
  });
});

describe("DocumentServerCallback.fromRequest", () => {
  it("reads the body and the headers of a Request", async () => {
    const token = await jwt.sign({ payload: save });
    const request = new Request("https://app.example.com/callback", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
    const { event } = await DocumentServerCallback.fromRequest(request, { verifier: jwt });

    expect(event).toMatchObject({ ...save, kind: "save" });
  });
});

describe("DocumentServerCallback.handle", () => {
  it("answers ok once the handler is done", async () => {
    const stored: string[] = [];
    const reply = await new DocumentServerCallback(save).handle({
      save: async (event) => {
        await Promise.resolve();
        stored.push(event.url);
      },
    });

    expect(reply).toEqual({ error: 0 });
    expect(stored).toEqual([save.url]);
  });

  it("answers fail when the handler failed, and tells of the error", async () => {
    const failure = new Error("storage unavailable");
    const onError = vi.fn();
    const reply = await new DocumentServerCallback(save).handle(
      { save: () => Promise.reject(failure) },
      { onError },
    );

    expect(reply).toEqual({ error: 1 });
    expect(onError).toHaveBeenCalledWith(failure, expect.objectContaining({ kind: "save" }));
  });

  it("answers fail when the handler threw", async () => {
    const reply = await new DocumentServerCallback(save).handle({
      save: () => {
        throw new Error("disk full");
      },
    });

    expect(reply).toBe(DocumentServerCallback.fail);
  });

  it("runs the handler of the kind, and no other", async () => {
    const handlers = { save: vi.fn(), closed: vi.fn(), forcesave: vi.fn() };

    await new DocumentServerCallback(body({ status: 4 })).handle(handlers);

    expect(handlers.closed).toHaveBeenCalledOnce();
    expect(handlers.save).not.toHaveBeenCalled();
    expect(handlers.forcesave).not.toHaveBeenCalled();
  });

  it.each([1, 3, 4, 6, 7, 9])("answers ok on status %i with no handler for it", async (status) => {
    const reply = await new DocumentServerCallback(body({ status })).handle({ save: vi.fn() });

    expect(reply).toBe(DocumentServerCallback.ok);
  });

  it("runs the handlers of the errors and of a status it does not know", async () => {
    const handlers = {
      save: vi.fn(),
      "save-error": vi.fn(),
      "forcesave-error": vi.fn(),
      unknown: vi.fn(),
    };

    await new DocumentServerCallback(body({ status: 3 })).handle(handlers);
    await new DocumentServerCallback(body({ status: 7 })).handle(handlers);
    await new DocumentServerCallback(body({ status: 9 })).handle(handlers);

    expect(handlers["save-error"]).toHaveBeenCalledOnce();
    expect(handlers["forcesave-error"]).toHaveBeenCalledOnce();
    expect(handlers.unknown).toHaveBeenCalledOnce();
  });

  it("runs the handler of the editing and of the forcesave", async () => {
    const handlers = { save: vi.fn(), editing: vi.fn(), forcesave: vi.fn() };

    await new DocumentServerCallback(body({ status: 1 })).handle(handlers);
    await new DocumentServerCallback(body({ status: 6, forcesavetype: 1 })).handle(handlers);

    expect(handlers.editing).toHaveBeenCalledOnce();
    expect(handlers.forcesave).toHaveBeenCalledWith(expect.objectContaining({ forcesavetype: 1 }));
  });

  it("freezes its answers", () => {
    expect(Object.isFrozen(DocumentServerCallback.ok)).toBe(true);
    expect(Object.isFrozen(DocumentServerCallback.fail)).toBe(true);
  });
});

describe("CallbackVerifier", () => {
  it("is what the signer of the sdk is", () => {
    expectTypeOf<DocumentServerJwt>().toExtend<CallbackVerifier>();
  });

  it("takes a verifier of its own", async () => {
    const verifier: CallbackVerifier = { verify: () => Promise.resolve(save) };
    const { event } = await DocumentServerCallback.parse(
      { body: { token: "opaque" } },
      { verifier },
    );

    expect(event.kind).toBe("save");
  });
});
