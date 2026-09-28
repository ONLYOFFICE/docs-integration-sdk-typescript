import { describe, expect, it } from "vitest";
import type { BuilderRequest, BuilderResponse } from "../../src/index.js";
import { client, downloadHead, fixtureUrl, jwt, poll } from "./env.js";

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
