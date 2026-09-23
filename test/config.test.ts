import { describe, expect, expectTypeOf, it } from "vitest";
import {
  buildDocumentKey,
  type ConfigSigner,
  DocumentServerConfig,
  DocumentServerFormats,
  DocumentServerJwt,
  type DocumentTypeLookup,
  type Format,
  type SignableConfig,
} from "../src/index.js";

const formats = new DocumentServerFormats([
  {
    name: "docx",
    type: "word",
    actions: ["view", "edit", "review", "comment"],
    convert: ["pdf"],
    mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  {
    name: "xlsx",
    type: "cell",
    actions: ["view", "edit"],
    convert: ["pdf"],
    mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  },
  {
    name: "png",
    type: "",
    actions: [],
    convert: [],
    mime: ["image/png"],
  },
] satisfies Format[]);

const file = {
  key: "Khirz6zTPdfd7",
  title: "Report.docx",
  url: "https://storage.example.com/report.docx",
};

function config(overrides?: Partial<SignableConfig>): SignableConfig {
  return {
    documentType: "word",
    document: { key: file.key, title: file.title, url: file.url, fileType: "docx" },
    ...overrides,
  };
}

describe("DocumentServerConfig", () => {
  it("keeps a valid config as it was given", () => {
    const { config: effective } = new DocumentServerConfig(config());

    expect(effective).toEqual({
      documentType: "word",
      document: { key: file.key, title: file.title, url: file.url, fileType: "docx" },
    });
  });

  it("freezes the config", () => {
    const { config: effective } = new DocumentServerConfig(config());

    expect(Object.isFrozen(effective)).toBe(true);
  });

  it("does not hold on to the object it was given", () => {
    const given = config();
    const { config: effective } = new DocumentServerConfig(given);

    given.width = "800px";

    expect(effective.width).toBeUndefined();
  });

  it("writes itself out as the config", () => {
    const instance = new DocumentServerConfig(config());

    expect(JSON.parse(JSON.stringify(instance))).toEqual(instance.config);
  });

  it("reads a file type down to the extension, in lower case", () => {
    const { config: effective } = new DocumentServerConfig(
      config({ document: { ...file, fileType: ".DOCX" as "docx" } }),
    );

    expect(effective.document.fileType).toBe("docx");
  });

  it("refuses a config that is not an object", () => {
    expect(() => new DocumentServerConfig(null as unknown as SignableConfig)).toThrow(
      /config must be an object/,
    );
  });

  it("refuses a config without a document", () => {
    expect(() => new DocumentServerConfig(config({ document: undefined }))).toThrow(
      /document must be an object/,
    );
  });

  it("refuses a document type the editors do not know", () => {
    expect(() => new DocumentServerConfig(config({ documentType: "text" as "word" }))).toThrow(
      /documentType must be one of/,
    );
  });

  it("refuses an empty key", () => {
    expect(() => new DocumentServerConfig(config({ document: { ...file, key: "" } }))).toThrow(
      /document.key must not be empty/,
    );
  });

  it("refuses a key longer than the server accepts", () => {
    expect(
      () => new DocumentServerConfig(config({ document: { ...file, key: "k".repeat(129) } })),
    ).toThrow(/at most 128 characters/);
  });

  it("refuses a key carrying a character the server does not accept", () => {
    expect(
      () => new DocumentServerConfig(config({ document: { ...file, key: "report 1" } })),
    ).toThrow(/document.key must be made of/);
  });

  it("refuses a relative document url", () => {
    expect(
      () => new DocumentServerConfig(config({ document: { ...file, url: "/report.docx" } })),
    ).toThrow(/document.url must be an absolute URL/);
  });

  it("refuses a document url that is neither http nor https", () => {
    expect(
      () => new DocumentServerConfig(config({ document: { ...file, url: "ftp://host/a.docx" } })),
    ).toThrow(/must use http or https/);
  });

  it("refuses a title longer than the server accepts", () => {
    expect(
      () => new DocumentServerConfig(config({ document: { ...file, title: "t".repeat(129) } })),
    ).toThrow(/document.title must be at most 128 characters/);
  });

  it("refuses a relative callback url", () => {
    expect(
      () => new DocumentServerConfig(config({ editorConfig: { callbackUrl: "/callback" } })),
    ).toThrow(/editorConfig.callbackUrl must be an absolute URL/);
  });

  it("keeps an editor config without a callback url", () => {
    const { config: effective } = new DocumentServerConfig(
      config({ editorConfig: { lang: "de", mode: "edit" } }),
    );

    expect(effective.editorConfig).toEqual({ lang: "de", mode: "edit" });
  });

  it("refuses the editor events, which are no part of a signed config", () => {
    const withEvents = { ...config(), events: { onAppReady: () => undefined } };

    expect(() => new DocumentServerConfig(withEvents as SignableConfig)).toThrow(
      /events must be no part of a config/,
    );
  });
});

describe("DocumentServerConfig.forFile", () => {
  it("reads the file type off the name and looks the document type up", () => {
    const { config: effective } = DocumentServerConfig.forFile(file, formats);

    expect(effective).toEqual({
      documentType: "word",
      document: { key: file.key, title: file.title, url: file.url, fileType: "docx" },
    });
  });

  it("looks up the editor of every format the server knows", () => {
    const { config: effective } = DocumentServerConfig.forFile(
      { ...file, title: "Budget.XLSX" },
      formats,
    );

    expect(effective.documentType).toBe("cell");
    expect(effective.document.fileType).toBe("xlsx");
  });

  it("lays the rest of the config over the derived one", () => {
    const { config: effective } = DocumentServerConfig.forFile(file, formats, {
      type: "mobile",
      editorConfig: { callbackUrl: "https://app.example.com/callback", lang: "fr" },
    });

    expect(effective.type).toBe("mobile");
    expect(effective.editorConfig?.callbackUrl).toBe("https://app.example.com/callback");
    expect(effective.document.key).toBe(file.key);
  });

  it("merges into the derived document rather than replacing it", () => {
    const { config: effective } = DocumentServerConfig.forFile(file, formats, {
      document: { key: file.key, url: file.url, permissions: { edit: false } },
    });

    expect(effective.document.fileType).toBe("docx");
    expect(effective.document.title).toBe(file.title);
    expect(effective.document.permissions).toEqual({ edit: false });
  });

  it("looks the document type up in a lookup of its own", () => {
    const lookup: DocumentTypeLookup = { getDocumentType: () => "diagram" };
    const { config: effective } = DocumentServerConfig.forFile(
      { ...file, title: "Plan.vsdx" },
      lookup,
    );

    expect(effective.documentType).toBe("diagram");
  });

  it("takes the formats of the server as its lookup", () => {
    expectTypeOf<DocumentServerFormats>().toExtend<DocumentTypeLookup>();
  });

  it("refuses a name without an extension", () => {
    expect(() => DocumentServerConfig.forFile({ ...file, title: "Report" }, formats)).toThrow(
      /must end in the extension/,
    );
  });

  it("refuses a format no editor opens", () => {
    expect(() => DocumentServerConfig.forFile({ ...file, title: "Chart.png" }, formats)).toThrow(
      /no editor opens png/,
    );
  });

  it("refuses a format the server does not know", () => {
    expect(() => DocumentServerConfig.forFile({ ...file, title: "Notes.zip" }, formats)).toThrow(
      /no editor opens zip/,
    );
  });
});

describe("DocumentServerConfig.sign", () => {
  const jwt = new DocumentServerJwt({ secret: "secret" });

  it("signs the config into a token it carries", async () => {
    const instance = DocumentServerConfig.forFile(file, formats);
    const signed = await instance.sign(jwt);

    expect(signed.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(await jwt.verify(signed.token ?? "")).toMatchObject(instance.config);
  });

  it("signs with a signer of its own", async () => {
    const payloads: object[] = [];
    const signer: ConfigSigner = {
      sign: (payload) => {
        payloads.push(payload);

        return Promise.resolve("signed");
      },
    };
    const instance = DocumentServerConfig.forFile(file, formats);
    const signed = await instance.sign(signer);

    expect(signed.token).toBe("signed");
    expect(payloads).toEqual([instance.config]);
  });

  it("takes the signer of the sdk", () => {
    expectTypeOf<DocumentServerJwt>().toExtend<ConfigSigner>();
  });

  it("leaves the config it signed alone", async () => {
    const instance = DocumentServerConfig.forFile(file, formats);

    await instance.sign(jwt);

    expect(instance.config.token).toBeUndefined();
  });

  it("signs over the config rather than over a token it already carries", async () => {
    const once = await DocumentServerConfig.forFile(file, formats).sign(jwt);
    const twice = await new DocumentServerConfig(once).sign(jwt);
    const claims = await jwt.verify(twice.token ?? "");

    expect(claims).not.toHaveProperty("token");
  });
});

describe("buildDocumentKey", () => {
  it("joins the parts it is given", () => {
    expect(buildDocumentKey("file-42", 1_732_000_000)).toBe("file-42_1732000000");
  });

  it("replaces every character the server does not accept", () => {
    expect(buildDocumentKey("files/report 1.docx", "v2")).toBe("files-report-1.docx_v2");
  });

  it("fits a long key into the 128 characters the server allows", () => {
    const key = buildDocumentKey("a".repeat(200), "1");

    expect(key).toHaveLength(128);
    expect(key).toMatch(/^[0-9a-zA-Z._=-]+$/);
  });

  it("keeps two long keys apart by what they end in", () => {
    const first = buildDocumentKey(`${"a".repeat(200)}-1`);
    const second = buildDocumentKey(`${"a".repeat(200)}-2`);

    expect(first).not.toBe(second);
  });

  it("builds the same key out of the same parts", () => {
    expect(buildDocumentKey("a".repeat(200))).toBe(buildDocumentKey("a".repeat(200)));
  });

  it("refuses to build a key out of nothing", () => {
    expect(() => buildDocumentKey()).toThrow(/at least one part/);
    expect(() => buildDocumentKey("/", "?")).toThrow(/must not be empty/);
  });
});
