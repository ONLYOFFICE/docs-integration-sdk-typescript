import { describe, expect, expectTypeOf, it } from "vitest";
import type * as clientMeta from "../src/client/meta.js";
import type * as lookup from "../src/formats/index.js";
import { DocumentServerFormats, type Format } from "../src/index.js";

const docx: Format = {
  name: "docx",
  type: "word",
  actions: ["view", "edit", "review", "comment", "encrypt"],
  convert: ["bmp", "docm", "pdf", "txt"],
  mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const doc: Format = {
  name: "doc",
  type: "word",
  actions: ["view", "auto-convert"],
  convert: ["docx", "pdf"],
  mime: ["application/msword"],
};

const odt: Format = {
  name: "odt",
  type: "word",
  actions: ["view", "lossy-edit", "review", "comment"],
  convert: ["docx", "pdf"],
  mime: ["application/vnd.oasis.opendocument.text"],
};

const xlsx: Format = {
  name: "xlsx",
  type: "cell",
  actions: ["view", "edit", "comment", "customfilter"],
  convert: ["csv", "ods", "pdf"],
  mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const pdf: Format = {
  name: "pdf",
  type: "pdf",
  actions: ["view", "fill", "comment"],
  convert: ["docx", "pdfa"],
  mime: ["application/pdf"],
};

const png: Format = {
  name: "png",
  type: "",
  actions: [],
  convert: [],
  mime: ["image/png"],
};

const zip: Format = {
  name: "zip",
  type: "",
  actions: [],
  convert: [],
  mime: ["application/zip", "application/x-zip-compressed"],
};

const all = [docx, doc, odt, xlsx, pdf, png, zip];

function formats(list: readonly Format[] = all): DocumentServerFormats {
  return new DocumentServerFormats(list);
}

describe("formats list", () => {
  it("keeps the formats in the order the server gave them", () => {
    expect(formats().all).toEqual(all);
  });

  it("freezes the list it keeps", () => {
    const kept = formats().all;

    expect(Object.isFrozen(kept)).toBe(true);
    expect(() => (kept as Format[]).push(png)).toThrow(TypeError);
  });

  it("copies the list, so a later change to the array is not seen", () => {
    const list = [docx];
    const known = formats(list);

    list.push(xlsx);

    expect(known.all).toEqual([docx]);
    expect(known.getFormat("xlsx")).toBeUndefined();
  });

  it("counts the extensions it covers", () => {
    expect(formats().size).toBe(7);
  });

  it("takes an empty list", () => {
    const empty = formats([]);

    expect(empty.size).toBe(0);
    expect(empty.getFormat("docx")).toBeUndefined();
  });

  it("refuses what is not an array", () => {
    expect(() => new DocumentServerFormats(undefined as unknown as Format[])).toThrow(TypeError);
    expect(() => new DocumentServerFormats({} as unknown as Format[])).toThrow(TypeError);
  });

  it("iterates the formats", () => {
    expect([...formats()]).toEqual(all);
  });
});

describe("getFormat", () => {
  it("finds a format by its extension", () => {
    expect(formats().getFormat("docx")).toEqual(docx);
  });

  it("passes over the dot, the case and the spaces around it", () => {
    for (const written of [".docx", "DOCX", ".DocX", "  docx  "]) {
      expect(formats().getFormat(written)).toEqual(docx);
    }
  });

  it("reads the extension off a whole file name", () => {
    expect(formats().getFormat("report.docx")).toEqual(docx);
    expect(formats().getFormat("/tmp/Q3 Report.DOCX")).toEqual(docx);
  });

  it("answers with undefined for an extension the server does not know", () => {
    expect(formats().getFormat("psd")).toBeUndefined();
    expect(formats().getFormat("")).toBeUndefined();
  });

  it("prefers the format an editor opens over one it does not", () => {
    const inert: Format = { name: "pdf", type: "", actions: [], convert: [], mime: [] };

    expect(formats([inert, pdf]).getFormat("pdf")).toEqual(pdf);
    expect(formats([pdf, inert]).getFormat("pdf")).toEqual(pdf);
  });

  it("hasFormat says whether the extension is known at all", () => {
    expect(formats().hasFormat("png")).toBe(true);
    expect(formats().hasFormat(".PNG")).toBe(true);
    expect(formats().hasFormat("psd")).toBe(false);
  });

  it("getExtensions lists them without the dots", () => {
    expect(formats().getExtensions()).toEqual(["docx", "doc", "odt", "xlsx", "pdf", "png", "zip"]);
  });
});

describe("getDocumentType", () => {
  it("names the editor a format opens in", () => {
    expect(formats().getDocumentType("docx")).toBe("word");
    expect(formats().getDocumentType("xlsx")).toBe("cell");
    expect(formats().getDocumentType(".PDF")).toBe("pdf");
  });

  it("answers with undefined for a format no editor opens", () => {
    expect(formats().getDocumentType("png")).toBeUndefined();
  });

  it("answers with undefined for an extension the server does not know", () => {
    expect(formats().getDocumentType("psd")).toBeUndefined();
  });
});

describe("actions", () => {
  it("lists what the editors may do with a format", () => {
    expect(formats().getActions("docx")).toEqual(docx.actions);
  });

  it("lists nothing for a format no editor opens, and for an unknown extension", () => {
    expect(formats().getActions("png")).toEqual([]);
    expect(formats().getActions("psd")).toEqual([]);
  });

  it("can answers for any action", () => {
    expect(formats().can("xlsx", "customfilter")).toBe(true);
    expect(formats().can("xlsx", "review")).toBe(false);
    expect(formats().can("psd", "view")).toBe(false);
  });

  it("isOpenable holds for a format an editor opens", () => {
    expect(formats().isOpenable("docx")).toBe(true);
    expect(formats().isOpenable("png")).toBe(false);
    expect(formats().isOpenable("psd")).toBe(false);
  });

  it("answers the named questions", () => {
    const known = formats();

    expect(known.isViewable("docx")).toBe(true);
    expect(known.isViewable("png")).toBe(false);
    expect(known.isEditable("docx")).toBe(true);
    expect(known.isEditable("odt")).toBe(false);
    expect(known.isLossyEditable("odt")).toBe(true);
    expect(known.isLossyEditable("docx")).toBe(false);
    expect(known.isFillable("pdf")).toBe(true);
    expect(known.isFillable("docx")).toBe(false);
    expect(known.isCommentable("pdf")).toBe(true);
    expect(known.isCommentable("doc")).toBe(false);
    expect(known.isReviewable("docx")).toBe(true);
    expect(known.isReviewable("xlsx")).toBe(false);
    expect(known.isAutoConvertable("doc")).toBe(true);
    expect(known.isAutoConvertable("docx")).toBe(false);
    expect(known.isEncryptable("docx")).toBe(true);
    expect(known.isEncryptable("pdf")).toBe(false);
  });
});

describe("conversion", () => {
  it("lists what a format converts to", () => {
    expect(formats().getConversions("docx")).toEqual(docx.convert);
  });

  it("lists nothing for a format the server does not convert", () => {
    expect(formats().getConversions("png")).toEqual([]);
    expect(formats().getConversions("psd")).toEqual([]);
  });

  it("answers whether one format turns into another", () => {
    const known = formats();

    expect(known.isConvertibleTo("docx", "pdf")).toBe(true);
    expect(known.isConvertibleTo("report.DOCX", ".PDF")).toBe(true);
    expect(known.isConvertibleTo("docx", "xlsx")).toBe(false);
    expect(known.isConvertibleTo("psd", "pdf")).toBe(false);
  });
});

describe("mime", () => {
  it("lists what a format is served as", () => {
    expect(formats().getMimes("png")).toEqual(["image/png"]);
    expect(formats().getMimes("psd")).toEqual([]);
  });

  it("finds the formats served under a MIME type", () => {
    expect(formats().getFormatsByMime("application/pdf")).toEqual([pdf]);
    expect(formats().getFormatsByMime("  APPLICATION/PDF ")).toEqual([pdf]);
    expect(formats().getFormatsByMime("application/x-zip-compressed")).toEqual([zip]);
    expect(formats().getFormatsByMime("application/x-photoshop")).toEqual([]);
  });

  it("keeps every format sharing a MIME type", () => {
    const shared: Format = { ...png, name: "apng" };

    expect(formats([png, shared]).getFormatsByMime("image/png")).toEqual([png, shared]);
  });
});

describe("getFormatsByType", () => {
  it("lists the formats one editor opens", () => {
    expect(formats().getFormatsByType("word")).toEqual([docx, doc, odt]);
    expect(formats().getFormatsByType("slide")).toEqual([]);
  });

  it("lists the ones a conversion only ever produces", () => {
    expect(formats().getFormatsByType("")).toEqual([png, zip]);
  });
});

describe("the format of the client", () => {
  it("is the format the lookup takes", () => {
    expectTypeOf<clientMeta.Format>().toEqualTypeOf<lookup.Format>();
    expectTypeOf<clientMeta.FormatAction>().toEqualTypeOf<lookup.FormatAction>();
    expectTypeOf<clientMeta.FormatType>().toEqualTypeOf<lookup.FormatType>();
  });
});

describe("a format the lookup does not know yet", () => {
  const vsdx: Format = {
    name: "vsdx",
    type: "board",
    actions: ["view", "sign"],
    convert: [],
    mime: [],
  };

  it("keeps its type and actions", () => {
    const lookup = new DocumentServerFormats([vsdx]);

    expect(lookup.getDocumentType("vsdx")).toBe("board");
    expect(lookup.can("vsdx", "sign")).toBe(true);
    expect(lookup.getFormatsByType("board")).toEqual([vsdx]);
  });
});
