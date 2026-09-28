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

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DocumentServerJwt, JwtError } from "../../src/index.js";
import { client, jwt, uniqueKey } from "./env.js";
import { startHost, type Host, type HostRequest } from "./host.js";

const SCRIPT = `builder.CreateFile("docx");
builder.SaveFile("docx", "hello.docx");
builder.CloseFile();
`;

let host: Host;

beforeAll(async () => {
  host = await startHost({
    "/hello.txt": "Hello from the integration tests.\n",
    "/hello.js": SCRIPT,
  });
});

afterAll(async () => {
  await host.close();
});

function requestFor(path: string): HostRequest {
  const request = host.requests.findLast((recorded) => recorded.path === path);

  if (request === undefined) {
    throw new Error(`the document server never asked for ${path}`);
  }

  return request;
}

describe("the token the document server downloads with", () => {
  it("carries the url of a document it converts, signed in a header", async () => {
    const url = host.url("/hello.txt");
    const convert = { filetype: "txt", key: uniqueKey(), outputtype: "pdf", url };

    await client.convert(convert, await jwt.signHeader(convert));

    await expect(jwt.verifyHeader(requestFor("/hello.txt").headers)).resolves.toEqual({ url });
  });

  it("carries the url of a script it runs", async () => {
    const url = host.url("/hello.js");
    const build = { url };

    await client.docbuilder(build, await jwt.signHeader(build));

    await expect(jwt.verifyHeader(requestFor("/hello.js").headers)).resolves.toEqual({ url });
  });

  it("is refused by a signer of another secret", async () => {
    const url = host.url("/hello.txt");
    const convert = { filetype: "txt", key: uniqueKey(), outputtype: "pdf", url };

    await client.convert(convert, await jwt.signHeader(convert));

    const error: unknown = await new DocumentServerJwt({ secret: "another-secret" })
      .verifyHeader(requestFor("/hello.txt").headers)
      .catch((reason: unknown) => reason);

    expect(JwtError.is(error)).toBe(true);
    expect(error).toMatchObject({ kind: "signature" });
  });
});
