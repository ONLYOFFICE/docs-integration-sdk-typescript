import { describe, expect, expectTypeOf, it } from "vitest";
import {
  buildDocumentKey,
  ConfigError,
  type ConfigInput,
  type ConfigSigner,
  DocumentServerConfig,
  DocumentServerFormats,
  DocumentServerJwt,
  type Format,
  type FormatLookup,
} from "../src/index.js";

function format(name: string, type: string, actions: string[]): Format {
  return { name, type, actions, convert: [], mime: [] };
}

const formats = new DocumentServerFormats([
  format("docx", "word", ["view", "edit", "review", "comment"]),
  format("xlsx", "cell", ["view", "edit", "customfilter"]),
  format("odt", "word", ["view", "lossy-edit"]),
  format("pdf", "pdf", ["view", "comment", "fill"]),
  format("ett", "cell", ["view"]),
  format("png", "", []),
]);

const callbackUrl = "https://app.example.com/callback";

type Overrides = Omit<Partial<ConfigInput>, "document"> & {
  document?: Partial<ConfigInput["document"]>;
};

function input(overrides: Overrides = {}): ConfigInput {
  const { document, ...rest } = overrides;

  return {
    ...rest,
    document: {
      key: "Khirz6zTPdfd7",
      title: "Report.docx",
      url: "https://storage.example.com/report.docx",
      permissions: { edit: true },
      ...document,
    },
    editorConfig: { callbackUrl, ...rest.editorConfig },
  };
}

function build(overrides?: Overrides): DocumentServerConfig {
  return new DocumentServerConfig(input(overrides), formats);
}

/** The error `run` throws, for asserting on its fields. */
function refusal(run: () => unknown): ConfigError {
  try {
    run();
  } catch (error) {
    if (ConfigError.is(error)) {
      return error;
    }

    throw error;
  }

  throw new Error("expected a ConfigError");
}

describe("DocumentServerConfig", () => {
  it("derives the file type and the document type", () => {
    const { config } = build();

    expect(config).toEqual({
      documentType: "word",
      document: {
        key: "Khirz6zTPdfd7",
        title: "Report.docx",
        url: "https://storage.example.com/report.docx",
        fileType: "docx",
        permissions: { edit: true },
      },
      editorConfig: { callbackUrl },
    });
  });

  it("reads the file type off the title in lower case", () => {
    const { config } = build({ document: { title: "Budget.XLSX" } });

    expect(config.documentType).toBe("cell");
    expect(config.document.fileType).toBe("xlsx");
  });

  it("finds the format in a lookup of its own", () => {
    const lookup: FormatLookup = {
      getFormat: (extension) => format(extension, "board", ["view", "edit"]),
    };
    const { config } = new DocumentServerConfig(
      input({ document: { title: "Plan.vsdx" } }),
      lookup,
    );

    expect(config.documentType).toBe("board");
  });

  it("takes the formats of the server as its lookup", () => {
    expectTypeOf<DocumentServerFormats>().toExtend<FormatLookup>();
  });

  it("freezes the config through and through", () => {
    const { config } = build();

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.document.permissions)).toBe(true);
    expect(Object.isFrozen(config.editorConfig)).toBe(true);
  });

  it("does not hold on to the objects it was given", () => {
    const given = input();
    const { config } = new DocumentServerConfig(given, formats);

    given.width = "800px";
    given.document.permissions.edit = false;

    expect(config.width).toBeUndefined();
    expect(config.document.permissions?.edit).toBe(true);
  });

  it("writes itself out as the config", () => {
    const instance = build();

    expect(JSON.parse(JSON.stringify(instance))).toEqual(instance.config);
  });

  it("replaces a document type and a file type it was given anyway", () => {
    const valid = input({ document: { title: "Budget.xlsx" } });
    const given = {
      ...valid,
      documentType: "word",
      document: { ...valid.document, fileType: "docx" },
    };
    const { config } = new DocumentServerConfig(given as unknown as ConfigInput, formats);

    expect(config.documentType).toBe("cell");
    expect(config.document.fileType).toBe("xlsx");
  });

  it("keeps a long title", () => {
    const title = `${"t".repeat(200)}.docx`;

    expect(build({ document: { title } }).config.document.title).toBe(title);
  });

  it("keeps the mode as it was given", () => {
    const { config } = build({ editorConfig: { mode: "view" } });

    expect(config.editorConfig?.mode).toBe("view");
  });

  it("keeps a logo that is not clickable", () => {
    const { config } = build({ editorConfig: { customization: { logo: { url: "" } } } });

    expect(config.editorConfig?.customization?.logo?.url).toBe("");
  });

  describe("refuses", () => {
    it("a format the server does not know", () => {
      const error = refusal(() => build({ document: { title: "Notes.zip" } }));

      expect(error.kind).toBe("unsupported");
      expect(error.field).toBe("document.title");
    });

    it("a format no editor opens", () => {
      expect(refusal(() => build({ document: { title: "Chart.png" } })).kind).toBe("unsupported");
    });

    it("a title without an extension", () => {
      expect(() => build({ document: { title: "Report" } })).toThrow(/must end in the extension/);
      expect(() => build({ document: { title: "Report." } })).toThrow(/must end in the extension/);
    });

    it("an empty title", () => {
      expect(() => build({ document: { title: "" } })).toThrow(/must end in the extension/);
    });

    it("a config that is not an object", () => {
      expect(() => new DocumentServerConfig(null as unknown as ConfigInput, formats)).toThrow(
        /config must be an object/,
      );
    });

    it("a config without a document", () => {
      const withoutDocument = { ...input(), document: undefined };

      expect(
        () => new DocumentServerConfig(withoutDocument as unknown as ConfigInput, formats),
      ).toThrow(/document must be an object/);
    });

    it("an empty key", () => {
      expect(() => build({ document: { key: "" } })).toThrow(/document.key must not be empty/);
    });

    it("a key longer than the server accepts", () => {
      expect(() => build({ document: { key: "k".repeat(129) } })).toThrow(/at most 128 characters/);
    });

    it("a key carrying a character the server does not accept", () => {
      expect(() => build({ document: { key: "report 1" } })).toThrow(
        /document.key must be made of/,
      );
    });

    it("a relative document url", () => {
      expect(() => build({ document: { url: "/report.docx" } })).toThrow(
        /document.url must be an absolute URL/,
      );
    });

    it("a document url that is neither http nor https", () => {
      expect(() => build({ document: { url: "ftp://host/a.docx" } })).toThrow(
        /must use http or https/,
      );
    });

    it("permissions without edit", () => {
      const permissions = {} as ConfigInput["document"]["permissions"];

      expect(() => build({ document: { permissions } })).toThrow(
        /document.permissions.edit must be a boolean/,
      );
    });

    it("a permission that is not a boolean", () => {
      const permissions = { edit: true, comment: "yes" as unknown as boolean };

      expect(() => build({ document: { permissions } })).toThrow(
        /document.permissions.comment must be a boolean/,
      );
    });

    it("a mode the editor does not know", () => {
      expect(() => build({ editorConfig: { mode: "review" as "edit" } })).toThrow(
        /editorConfig.mode must be "edit" or "view"/,
      );
    });

    it("a user without an id", () => {
      expect(() => build({ editorConfig: { user: { name: "Anna" } } })).toThrow(
        /editorConfig.user.id must be a string/,
      );
    });

    it("a user id longer than the server accepts", () => {
      expect(() => build({ editorConfig: { user: { id: "u".repeat(129) } } })).toThrow(
        /editorConfig.user.id must be at most 128 characters/,
      );
    });

    it.each([
      ["editorConfig.createUrl", { createUrl: "/new" }],
      ["editorConfig.templates[0].url", { templates: [{ title: "Blank", url: "/blank" }] }],
      ["editorConfig.customization.goback.url", { customization: { goback: { url: "/" } } }],
      ["editorConfig.embedded.shareUrl", { embedded: { shareUrl: "/share" } }],
    ])("a relative %s", (field, editorConfig) => {
      const error = refusal(() => build({ editorConfig }));

      expect(error.field).toBe(field);
      expect(error.message).toMatch(/must be an absolute URL/);
    });
  });

  describe("permissions", () => {
    it("keeps what the format allows", () => {
      const permissions = { edit: true, review: true, comment: true, download: false };
      const { config } = build({ document: { permissions } });

      expect(config.document.permissions).toEqual(permissions);
    });

    it("lowers edit for a format the editors only view", () => {
      const { config } = build({ document: { title: "Template.ett" } });

      expect(config.document.permissions?.edit).toBe(false);
    });

    it("keeps edit for a format edited at a loss", () => {
      const { config } = build({ document: { title: "Letter.odt" } });

      expect(config.document.permissions?.edit).toBe(true);
    });

    it("lowers every permission the format does not allow", () => {
      const { config } = build({
        document: {
          title: "Budget.xlsx",
          permissions: {
            edit: true,
            review: true,
            comment: true,
            fillForms: true,
            modifyFilter: true,
          },
        },
      });

      expect(config.document.permissions).toEqual({
        edit: true,
        review: false,
        comment: false,
        fillForms: false,
        modifyFilter: true,
      });
    });

    it("adds no permission it was not given", () => {
      const { config } = build({ document: { title: "Form.pdf" } });

      expect(config.document.permissions).toEqual({ edit: false });
    });

    it("leaves the permissions that do not depend on the format", () => {
      const permissions = { edit: false, print: true, copy: false, chat: false };
      const { config } = build({ document: { permissions } });

      expect(config.document.permissions).toEqual(permissions);
    });
  });

  describe("callbackUrl", () => {
    it("is cut in view mode, forcesave along with it", () => {
      const { config } = build({
        editorConfig: { mode: "view", customization: { forcesave: true } },
      });

      expect(config.editorConfig).toEqual({ mode: "view", customization: {} });
    });

    it("is cut for a user who may change nothing", () => {
      const { config } = build({ document: { permissions: { edit: false } } });

      expect(config.editorConfig?.callbackUrl).toBeUndefined();
    });

    it("is cut once the format lowered every permission that changes the document", () => {
      const { config } = build({ document: { title: "Template.ett" } });

      expect(config.editorConfig?.callbackUrl).toBeUndefined();
    });

    it("is not checked when it is cut", () => {
      const { config } = build({ editorConfig: { mode: "view", callbackUrl: "/callback" } });

      expect(config.editorConfig?.callbackUrl).toBeUndefined();
    });

    it.each([
      ["edit", "Report.docx", { edit: true }],
      ["review", "Report.docx", { edit: false, review: true }],
      ["comment", "Report.docx", { edit: false, comment: true }],
      ["fillForms", "Form.pdf", { edit: false, fillForms: true }],
    ])("is kept for a user who may %s", (_, title, permissions) => {
      const { config } = build({ document: { title, permissions } });

      expect(config.editorConfig?.callbackUrl).toBe(callbackUrl);
    });

    it("is kept when the mode is left to its default of edit", () => {
      const { config } = build({ editorConfig: { lang: "de" } });

      expect(config.editorConfig?.callbackUrl).toBe(callbackUrl);
    });

    it("is required where the changes are saved through it", () => {
      const given: ConfigInput = { ...input(), editorConfig: { lang: "de" } };
      const error = refusal(() => new DocumentServerConfig(given, formats));

      expect(error.field).toBe("editorConfig.callbackUrl");
      expect(error.message).toMatch(/is required/);
    });

    it("is required without an editor config at all", () => {
      const given = input();

      delete given.editorConfig;

      expect(refusal(() => new DocumentServerConfig(given, formats)).field).toBe(
        "editorConfig.callbackUrl",
      );
    });

    it("is refused when relative and kept", () => {
      expect(() => build({ editorConfig: { callbackUrl: "/callback" } })).toThrow(
        /editorConfig.callbackUrl must be an absolute URL/,
      );
    });
  });
});

describe("DocumentServerConfig.sign", () => {
  const jwt = new DocumentServerJwt({ secret: "secret" });

  it("signs the config into a token it carries", async () => {
    const instance = build();
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
    const instance = build();
    const signed = await instance.sign(signer);

    expect(signed.token).toBe("signed");
    expect(payloads).toEqual([instance.config]);
  });

  it("takes the signer of the sdk", () => {
    expectTypeOf<DocumentServerJwt>().toExtend<ConfigSigner>();
  });

  it("signs over the config rather than over a token it already carries", async () => {
    const given = { ...input(), token: "stale" };
    const instance = new DocumentServerConfig(given as unknown as ConfigInput, formats);
    const signed = await instance.sign(jwt);

    expect(signed.token).not.toBe("stale");
    expect(await jwt.verify(signed.token ?? "")).not.toHaveProperty("token");
  });

  it("leaves the config it signed alone", async () => {
    const instance = build();

    await instance.sign(jwt);

    expect(instance.config.token).toBeUndefined();
  });
});

describe("ConfigInput", () => {
  it("requires permissions.edit", () => {
    expectTypeOf<ConfigInput["document"]["permissions"]["edit"]>().toEqualTypeOf<boolean>();
  });

  it("takes none of the fields the sdk derives", () => {
    expectTypeOf<ConfigInput["documentType"]>().toEqualTypeOf<undefined>();
    expectTypeOf<ConfigInput["token"]>().toEqualTypeOf<undefined>();
    expectTypeOf<ConfigInput["document"]["fileType"]>().toEqualTypeOf<undefined>();
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
