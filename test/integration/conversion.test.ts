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
import {
  ConversionError,
  DocumentServerJwt,
  type ConvertFileRequest,
  type ConvertRequest,
} from "../../src/index.js";
import { client, downloadHead, fixtureUrl, head, jwt, poll, uniqueKey } from "./env.js";

const OPERATION = { operation: "converter" } as const;

const stranger = new DocumentServerJwt({ secret: "another-secret" });

function request(overrides: Partial<ConvertRequest> = {}): ConvertRequest {
  return {
    filetype: "txt",
    key: uniqueKey(),
    outputtype: "pdf",
    url: fixtureUrl("hello.txt"),
    ...overrides,
  };
}

function file(): Blob {
  return new Blob(["Hello from the integration tests.\n"], { type: "text/plain" });
}

describe("convert", () => {
  it("converts a document signed in a header, and the result downloads", async () => {
    const convert = request();
    const result = await client.convert(convert, await jwt.signHeader(convert));

    expect(result).toMatchObject({ endConvert: true, fileType: "pdf", percent: 100 });
    expect(await downloadHead(result.fileUrl ?? "", 5)).toBe("%PDF-");
  });

  it("converts a document signed in the body", async () => {
    const convert = request();
    const result = await client.convert({ ...convert, token: await jwt.sign(convert) });

    expect(result).toMatchObject({ endConvert: true, fileType: "pdf" });
  });

  it("converts a document asynchronously, asked again until it is done", async () => {
    const convert = request({ async: true });
    const first = await client.convert(convert, await jwt.signHeader(convert));

    expect(first.endConvert).toBe(false);

    const last = await poll(
      async () => await client.convert(convert, await jwt.signHeader(convert)),
      (result) => result.endConvert === true,
    );

    expect(last.endConvert).toBe(true);
    expect(await downloadHead(last.fileUrl ?? "", 5)).toBe("%PDF-");
  });

  it("refuses a request without a token as an invalid token", async () => {
    await expect(client.convert(request())).rejects.toMatchObject({
      name: "ConversionError",
      code: -8,
    });
  });

  it("refuses a token of another secret as an invalid token", async () => {
    const convert = request();

    await expect(client.convert(convert, await stranger.signHeader(convert))).rejects.toMatchObject(
      { name: "ConversionError", code: -8 },
    );
  });

  it("rejects with the code of an output format it cannot convert to", async () => {
    const convert = request({ outputtype: "unknown" });
    const error: unknown = await client
      .convert(convert, await jwt.signHeader(convert))
      .catch((reason: unknown) => reason);

    expect(ConversionError.is(error)).toBe(true);
    expect(error).toMatchObject({ code: -7 });
  });

  it("rejects with the code of a source it cannot download", async () => {
    const convert = request({ url: fixtureUrl("missing.txt") });

    await expect(client.convert(convert, await jwt.signHeader(convert))).rejects.toMatchObject({
      name: "ConversionError",
      code: -4,
    });
  });
});

describe("convertFromFile", () => {
  const convert: ConvertFileRequest = { filetype: "txt", outputtype: "pdf", title: "hello.pdf" };

  it("converts a document sent in a header-signed request, answering with the file", async () => {
    const result = await client.convertFromFile(
      convert,
      file(),
      await jwt.signHeader(convert, OPERATION),
    );

    if (!result.endConvert) {
      throw new Error("the conversion did not finish");
    }

    expect(result.file.headers.get("content-type")).toBe("application/pdf");
    expect(result.file.headers.get("content-disposition")).toContain("hello.pdf");
    expect(await head(result.file, 5)).toBe("%PDF-");
  });

  it("converts a document sent in a body-signed request", async () => {
    const result = await client.convertFromFile(
      { ...convert, token: await jwt.sign(convert, OPERATION) },
      file(),
    );

    if (!result.endConvert) {
      throw new Error("the conversion did not finish");
    }

    expect(await head(result.file, 5)).toBe("%PDF-");
  });

  it("converts a document asynchronously, sent again until it is done", async () => {
    const pending: ConvertFileRequest = { ...convert, key: uniqueKey(), async: true };
    const last = await poll(
      async () =>
        await client.convertFromFile(pending, file(), await jwt.signHeader(pending, OPERATION)),
      (result) => result.endConvert,
    );

    if (!last.endConvert) {
      throw new Error("the conversion did not finish");
    }

    expect(await head(last.file, 5)).toBe("%PDF-");
  });

  it("refuses a token without the operation claim as an invalid token", async () => {
    await expect(
      client.convertFromFile(convert, file(), await jwt.signHeader(convert)),
    ).rejects.toMatchObject({ name: "ConversionError", code: -8 });
  });
});
