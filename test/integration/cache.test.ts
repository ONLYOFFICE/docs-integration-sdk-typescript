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

import { describe, expect, it, vi } from "vitest";
import { DocumentServerFormats, DocumentServerMetaCache } from "../../src/index.js";
import { client } from "./env.js";

describe("cache", () => {
  it("loads the config and the formats once and hands them out after", async () => {
    const getConfig = vi.spyOn(client, "getConfig");
    const getFormats = vi.spyOn(client, "getFormats");

    try {
      const config = new DocumentServerMetaCache({
        getData: (signal) => client.getConfig({ signal }),
      });
      const formats = new DocumentServerMetaCache({
        getData: async (signal) => new DocumentServerFormats(await client.getFormats({ signal })),
      });

      const list = await formats.get();

      expect((await config.get())?.urls.command).toBe("/command");
      expect(list?.getDocumentType("docx")).toBe("word");
      expect(await formats.get()).toBe(list);
      expect(getConfig).toHaveBeenCalledOnce();
      expect(getFormats).toHaveBeenCalledOnce();
    } finally {
      getConfig.mockRestore();
      getFormats.mockRestore();
    }
  });
});
