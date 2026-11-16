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

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { BuildFileRequest, BuilderRequest, BuilderResponse } from "../../src/index.js";
import { client, downloadHead, fixtureUrl, jwt, poll } from "./env.js";

const OPERATION = { operation: "docbuilder" } as const;

const SCRIPT = readFileSync(new URL("fixtures/hello.docbuilder", import.meta.url), "utf8");

async function build(request: BuilderRequest): Promise<BuilderResponse> {
  return await client.docbuilder(request, await jwt.signHeader(request));
}

describe("docbuilder", () => {
  it("runs a script, and the file it saves downloads", async () => {
    const result = await build({ url: fixtureUrl("hello.docbuilder") });

    expect(result.end).toBe(true);
    expect(await downloadHead(result.urls?.["hello.docx"] ?? "", 2)).toBe("PK");
  });

  it("runs a script asynchronously, asked again by its key until it is done", async () => {
    const first = await build({ url: fixtureUrl("hello.docbuilder"), async: true });

    expect(first.end).toBe(false);

    const key = first.key ?? "";
    const last = await poll(
      async () => await build({ key }),
      (result) => result.end === true,
    );

    expect(last.end).toBe(true);
    expect(await downloadHead(last.urls?.["hello.docx"] ?? "", 2)).toBe("PK");
  });

  it("rejects with the code of a script it cannot download", async () => {
    await expect(build({ url: fixtureUrl("missing.docbuilder") })).rejects.toMatchObject({
      name: "BuilderError",
      code: -4,
    });
  });
});

describe("docbuilderFromFile", () => {
  async function buildFromFile(request: BuildFileRequest, file: Blob): Promise<BuilderResponse> {
    return await client.docbuilderFromFile(request, file, await jwt.signHeader(request, OPERATION));
  }

  it("runs a script sent in a header-signed request, and the file it saves downloads", async () => {
    const result = await buildFromFile({}, new Blob([SCRIPT]));

    expect(result.end).toBe(true);
    expect(await downloadHead(result.urls?.["hello.docx"] ?? "", 2)).toBe("PK");
  });

  it("runs a script sent in a body-signed request, under its own name", async () => {
    const result = await client.docbuilderFromFile(
      { token: await jwt.sign({}, OPERATION) },
      new File([SCRIPT], "hello.js"),
    );

    expect(result.end).toBe(true);
  });

  it("runs a script asynchronously, asked after by its key through docbuilder", async () => {
    const first = await buildFromFile({ async: true }, new Blob([SCRIPT]));

    expect(first.end).toBe(false);

    const key = first.key ?? "";
    const last = await poll(
      async () => await build({ key }),
      (result) => result.end === true,
    );

    expect(await downloadHead(last.urls?.["hello.docx"] ?? "", 2)).toBe("PK");
  });

  it("refuses a token without the operation claim as an invalid token", async () => {
    const request: BuildFileRequest = {};

    await expect(
      client.docbuilderFromFile(request, new Blob([SCRIPT]), await jwt.signHeader(request)),
    ).rejects.toMatchObject({ name: "BuilderError", code: -8 });
  });

  it("rejects with the code of a script that does not run", async () => {
    await expect(buildFromFile({}, new Blob(["this is not a script ((("]))).rejects.toMatchObject({
      name: "BuilderError",
      code: -3,
    });
  });
});
