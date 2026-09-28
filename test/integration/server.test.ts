import { describe, expect, it } from "vitest";
import { DocumentServerFormats } from "../../src/index.js";
import { client } from "./env.js";

describe("server", () => {
  it("reports itself healthy", async () => {
    expect(await client.healthcheck()).toBe(true);
  });

  it("describes its endpoints and the header it expects a token in", async () => {
    const config = await client.getConfig();

    expect(config.authorization).toEqual({ header: "Authorization", prefix: "Bearer " });
    expect(config.urls).toMatchObject({
      command: "/command",
      converter: "/converter",
      converterFromFile: "/converter/from-file",
      docbuilder: "/docbuilder",
    });
    expect(config.limits.maxFileSize).toBeGreaterThan(0);
    expect(config.langs).toContain("en");
  });

  it("lists formats the lookup reads", async () => {
    const formats = new DocumentServerFormats(await client.getFormats());

    expect(formats.getDocumentType("docx")).toBe("word");
    expect(formats.getDocumentType("xlsx")).toBe("cell");
    expect(formats.getDocumentType("pptx")).toBe("slide");
    expect(formats.getDocumentType("pdf")).toBe("pdf");
    expect(formats.isEditable("docx")).toBe(true);
    expect(formats.isConvertibleTo("txt", "pdf")).toBe(true);
    expect(formats.getMimes("docx")).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});
