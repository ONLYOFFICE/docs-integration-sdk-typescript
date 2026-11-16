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
  DocumentServerClient,
  DocumentServerNetworkError,
  DocumentServerTimeoutError,
} from "../../src/index.js";
import { client, fixtureUrl, jwt, uniqueKey } from "./env.js";

describe("a request that gets no answer", () => {
  it("rejects with a timeout when the conversion outlasts timeoutMs", async () => {
    const convert = {
      filetype: "txt",
      key: uniqueKey(),
      outputtype: "pdf",
      url: fixtureUrl("hello.txt"),
    };
    const error: unknown = await client
      .convert(convert, await jwt.signHeader(convert), { timeoutMs: 1 })
      .catch((reason: unknown) => reason);

    expect(DocumentServerTimeoutError.is(error)).toBe(true);
    expect(error).toMatchObject({
      kind: "timeout",
      timeoutMs: 1,
      url: `${client.options.baseUrl}/converter`,
    });
  });

  it("rejects with a network error when nothing listens at the address", async () => {
    const unreachable = new DocumentServerClient({ baseUrl: "http://127.0.0.1:1" });
    const error: unknown = await unreachable.healthcheck().catch((reason: unknown) => reason);

    expect(DocumentServerNetworkError.is(error)).toBe(true);
    expect(error).toMatchObject({ kind: "network", url: "http://127.0.0.1:1/healthcheck" });
  });
});
