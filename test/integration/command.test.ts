import { describe, expect, it } from "vitest";
import { DocumentServerJwt, type CommandRequest, type CommandResponse } from "../../src/index.js";
import { client, jwt, uniqueKey } from "./env.js";

async function run(command: CommandRequest): Promise<CommandResponse> {
  return await client.command(command, await jwt.signHeader(command));
}

describe("command", () => {
  it("answers version with the version of the server", async () => {
    const result = await run({ c: "version" });

    expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("answers license with the terms, the server and the quota", async () => {
    const result = await run({ c: "license" });

    expect(result.license).toMatchObject({ connections: expect.any(Number) as unknown });
    expect(result.server).toBeDefined();
    expect(result.quota).toBeDefined();
  });

  it("answers getForgottenList with a list of keys", async () => {
    const result = await run({ c: "getForgottenList" });

    expect(Array.isArray(result.keys)).toBe(true);
  });

  it("accepts a command signed in the body", async () => {
    const command: CommandRequest = { c: "version" };
    const result = await client.command({ ...command, token: await jwt.sign(command) });

    expect(result.version).toBeDefined();
  });

  it.each(["info", "forcesave", "getForgotten"] as const)(
    "rejects %s of a document nobody has open with code 1",
    async (c) => {
      await expect(run({ c, key: uniqueKey() })).rejects.toMatchObject({
        name: "CommandError",
        code: 1,
      });
    },
  );

  it("refuses a token of another secret with code 6", async () => {
    const command: CommandRequest = { c: "version" };
    const token = await new DocumentServerJwt({ secret: "another-secret" }).signHeader(command);

    await expect(client.command(command, token)).rejects.toMatchObject({
      name: "CommandError",
      code: 6,
    });
  });
});
