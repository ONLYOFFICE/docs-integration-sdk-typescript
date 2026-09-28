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

import { describe, expect, it } from "vitest";
import { DocumentServerFormats, type FormatAction, type FormatType } from "../../src/index.js";
import { client } from "./env.js";

const KNOWN_TYPES: readonly FormatType[] = ["", "cell", "diagram", "pdf", "slide", "word"];

const KNOWN_ACTIONS: readonly FormatAction[] = [
  "auto-convert",
  "comment",
  "customfilter",
  "edit",
  "encrypt",
  "fill",
  "lossy-edit",
  "review",
  "view",
];

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

  it("names no type or action the SDK does not know", async () => {
    const formats = await client.getFormats();
    const types = new Set(formats.map((format) => format.type));
    const actions = new Set(formats.flatMap((format) => format.actions));

    expect([...types].filter((type) => !KNOWN_TYPES.includes(type))).toEqual([]);
    expect([...actions].filter((action) => !KNOWN_ACTIONS.includes(action))).toEqual([]);
  });

  it("gives every format a name, a list of conversions and a list of mime types", async () => {
    for (const format of await client.getFormats()) {
      expect(format.name).toMatch(/^[a-z0-9]+$/);
      expect(Array.isArray(format.convert)).toBe(true);
      expect(Array.isArray(format.mime)).toBe(true);
    }
  });
});
