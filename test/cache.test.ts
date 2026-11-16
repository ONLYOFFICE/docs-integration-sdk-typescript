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

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  type ConfigResponse,
  DocumentServerClient,
  DocumentServerFormats,
  DocumentServerMetaCache,
  type Format,
  type MetaCacheOptions,
} from "../src/index.js";

interface Config {
  version: number;
  langs: string[];
}

const docx: Format = {
  name: "docx",
  type: "word",
  actions: ["view", "edit"],
  convert: ["pdf"],
  mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });

  return { promise, resolve, reject };
}

class FakeSource {
  version = 1;
  failure: Error | undefined = undefined;
  gate: Deferred<void> | undefined = undefined;
  calls = 0;

  signals: AbortSignal[] = [];

  getData = async (signal: AbortSignal): Promise<Config> => {
    this.calls += 1;
    this.signals.push(signal);
    await this.gate?.promise;

    if (this.failure !== undefined) {
      throw this.failure;
    }

    return { version: this.version, langs: ["en"] };
  };
}

let clock: number;
let timeouts: { ms: number; controller: AbortController }[];

function fireTimeout(index: number): void {
  timeouts[index]?.controller.abort(new DOMException("timed out", "TimeoutError"));
}

function setup(options: Partial<MetaCacheOptions<Config>> = {}, source = new FakeSource()) {
  const cache = new DocumentServerMetaCache<Config>({
    getData: source.getData,
    ttlMs: 1_000,
    retryMs: 100,
    ...options,
  });

  return { cache, source };
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  clock = 1_000;
  vi.spyOn(Date, "now").mockImplementation(() => clock);
  timeouts = [];
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    const controller = new AbortController();
    timeouts.push({ ms, controller });
    return controller.signal;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DocumentServerMetaCache", () => {
  it("sends no request until the first get", async () => {
    const { cache, source } = setup();

    await settle();
    expect(source.calls).toBe(0);

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(source.calls).toBe(1);
  });

  it("resolves the calls made while the first load runs to null at once", async () => {
    const source = new FakeSource();
    source.gate = deferred();
    const { cache } = setup({}, source);
    const first = cache.get();

    expect(await cache.get()).toBeNull();
    expect(source.calls).toBe(1);

    source.gate.resolve();

    expect(await first).toEqual({ version: 1, langs: ["en"] });
  });

  it("resolves to the same data while it is fresh without loading again", async () => {
    const { cache, source } = setup();
    const first = await cache.get();
    clock += 999;

    expect(await cache.get()).toBe(first);
    expect(source.calls).toBe(1);
  });

  it("makes the call that finds the data stale wait for the new data", async () => {
    const { cache, source } = setup();

    await cache.get();
    source.version = 2;
    clock += 1_000;

    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
    expect(source.calls).toBe(2);
  });

  it("resolves the calls made while a reload runs to the old data at once", async () => {
    const { cache, source } = setup();

    await cache.get();
    source.version = 2;
    source.gate = deferred();
    clock += 1_000;
    const first = cache.get();

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(source.calls).toBe(2);

    source.gate.resolve();

    expect(await first).toEqual({ version: 2, langs: ["en"] });
    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
  });

  it("holds what getData resolves to as is", async () => {
    const formats = new DocumentServerFormats([docx]);
    const cache = new DocumentServerMetaCache({
      getData: () => Promise.resolve(formats),
    });

    expect(await cache.get()).toBe(formats);
    expect((await cache.get())?.getDocumentType("docx")).toBe("word");
  });

  it("resolves to the old data when a reload fails and reports the error", async () => {
    const onError = vi.fn();
    const { cache, source } = setup({ onError });

    await cache.get();
    const failure = new Error("down");
    source.failure = failure;
    clock += 1_000;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("resolves to null when the first load fails and reports the error", async () => {
    const onError = vi.fn();
    const source = new FakeSource();
    source.failure = new Error("down");
    const { cache } = setup({ onError }, source);

    expect(await cache.get()).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("does not load again until retryMs after a failure", async () => {
    const source = new FakeSource();
    source.failure = new Error("down");
    const { cache } = setup({}, source);

    await cache.get();
    source.failure = undefined;
    clock += 99;

    expect(await cache.get()).toBeNull();
    expect(source.calls).toBe(1);

    clock += 1;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(source.calls).toBe(2);
  });

  it("reloads old data retryMs after a failed reload, not ttlMs", async () => {
    const { cache, source } = setup();

    await cache.get();
    source.failure = new Error("down");
    clock += 1_000;
    await cache.get();
    source.failure = undefined;
    source.version = 2;
    clock += 99;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(source.calls).toBe(2);

    clock += 1;

    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
    expect(source.calls).toBe(3);
  });

  it("waits a minute after a failure by default", async () => {
    const source = new FakeSource();
    source.failure = new Error("down");
    const cache = new DocumentServerMetaCache({ getData: source.getData });

    await cache.get();
    clock += 59_999;
    await cache.get();
    expect(source.calls).toBe(1);

    clock += 1;
    await cache.get();
    expect(source.calls).toBe(2);
  });

  it("catches a getData that throws at once", async () => {
    const onError = vi.fn();
    const failure = new Error("sync");
    const cache = new DocumentServerMetaCache<Config>({
      getData: () => {
        throw failure;
      },
      onError,
    });

    expect(await cache.get()).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("does not reject when onError throws", async () => {
    const source = new FakeSource();
    const { cache } = setup(
      {
        onError: () => {
          throw new Error("logger");
        },
      },
      source,
    );

    await cache.get();
    source.failure = new Error("down");
    clock += 1_000;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
  });

  it("counts a load still running after loadTimeoutMs as failed", async () => {
    const onError = vi.fn();
    const source = new FakeSource();
    const { cache } = setup({ onError, loadTimeoutMs: 500 }, source);

    await cache.get();
    source.gate = deferred();
    clock += 1_000;
    void cache.get();
    clock += 499;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(onError).not.toHaveBeenCalled();

    clock += 1;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(DOMException);
    expect((onError.mock.calls[0]?.[0] as DOMException).name).toBe("TimeoutError");
    expect(source.calls).toBe(2);

    source.gate = undefined;
    source.version = 2;
    clock += 100;

    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
    expect(source.calls).toBe(3);
  });

  it("ignores what a load that timed out ends with", async () => {
    const onError = vi.fn();
    const source = new FakeSource();
    source.gate = deferred();
    const gate = source.gate;
    const { cache } = setup({ onError, loadTimeoutMs: 500, retryMs: 0 }, source);
    const stuck = cache.get();
    clock += 500;
    source.gate = undefined;
    source.version = 2;

    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });

    source.version = 1;
    gate.resolve();

    expect(await stuck).toEqual({ version: 2, langs: ["en"] });
    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
    expect(source.calls).toBe(2);
    expect(onError).toHaveBeenCalledOnce();
  });

  it("passes getData a signal that aborts after loadTimeoutMs", async () => {
    const { cache, source } = setup({ loadTimeoutMs: 500 });

    await cache.get();

    expect(timeouts).toHaveLength(1);
    expect(timeouts[0]?.ms).toBe(500);
    expect(source.signals[0]).toBe(timeouts[0]?.controller.signal);
  });

  it("stops listening to the signal once the load ends", async () => {
    const add = vi.spyOn(EventTarget.prototype, "addEventListener");
    const remove = vi.spyOn(EventTarget.prototype, "removeEventListener");
    const { cache, source } = setup();

    await cache.get();
    source.failure = new Error("down");
    clock += 1_000;
    await cache.get();

    const listeners = add.mock.calls.filter(([type]) => type === "abort").map(([, l]) => l);

    expect(listeners).toHaveLength(2);
    for (const listener of listeners) {
      expect(remove).toHaveBeenCalledWith("abort", listener);
    }
  });

  it("aborts after a minute by default", async () => {
    const source = new FakeSource();
    const cache = new DocumentServerMetaCache({ getData: source.getData });

    await cache.get();

    expect(timeouts[0]?.ms).toBe(60_000);
  });

  it("resolves the waiting call to the old data once the signal aborts", async () => {
    const onError = vi.fn();
    const { cache, source } = setup({ onError, loadTimeoutMs: 500 });

    await cache.get();
    source.gate = deferred();
    const gate = source.gate;
    clock += 1_000;
    const waiting = cache.get();

    fireTimeout(1);

    expect(await waiting).toEqual({ version: 1, langs: ["en"] });
    expect(onError).toHaveBeenCalledOnce();
    expect((onError.mock.calls[0]?.[0] as DOMException).name).toBe("TimeoutError");

    source.version = 2;
    gate.resolve();
    await settle();

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });
    expect(source.calls).toBe(2);

    source.gate = undefined;
    clock += 100;

    expect(await cache.get()).toEqual({ version: 2, langs: ["en"] });
    expect(source.calls).toBe(3);
  });

  it("does not report a load twice when the signal aborts after get counted it as failed", async () => {
    const onError = vi.fn();
    const source = new FakeSource();
    source.gate = deferred();
    const { cache } = setup({ onError, loadTimeoutMs: 500, retryMs: 0 }, source);
    const stuck = cache.get();
    clock += 500;
    source.gate = undefined;

    expect(await cache.get()).toEqual({ version: 1, langs: ["en"] });

    fireTimeout(0);

    expect(await stuck).toEqual({ version: 1, langs: ["en"] });
    expect(onError).toHaveBeenCalledOnce();
  });

  it("does not report the failure of a load that timed out", async () => {
    const onError = vi.fn();
    const source = new FakeSource();
    source.gate = deferred();
    const gate = source.gate;
    const { cache } = setup({ onError, loadTimeoutMs: 500, retryMs: 0 }, source);
    const stuck = cache.get();
    clock += 500;
    source.gate = undefined;

    await cache.get();
    source.failure = new Error("late");
    gate.resolve();

    expect(await stuck).toEqual({ version: 1, langs: ["en"] });
    expect(onError).toHaveBeenCalledOnce();
  });

  it("validates the numbers of the options", () => {
    const getData = () => Promise.resolve({});

    expect(() => new DocumentServerMetaCache({ getData, ttlMs: 0 })).toThrow(TypeError);
    expect(() => new DocumentServerMetaCache({ getData, ttlMs: 1.5 })).toThrow(TypeError);
    expect(() => new DocumentServerMetaCache({ getData, retryMs: -1 })).toThrow(TypeError);
    expect(() => new DocumentServerMetaCache({ getData, retryMs: Infinity })).toThrow(TypeError);
    expect(() => new DocumentServerMetaCache({ getData, retryMs: 0 })).not.toThrow();
    expect(() => new DocumentServerMetaCache({ getData, loadTimeoutMs: 0 })).toThrow(TypeError);
    expect(() => new DocumentServerMetaCache({ getData, loadTimeoutMs: 1 })).not.toThrow();
  });

  it("refuses a loadTimeoutMs longer than timers support", () => {
    const getData = () => Promise.resolve({});

    expect(
      () => new DocumentServerMetaCache({ getData, loadTimeoutMs: 2_147_483_647 }),
    ).not.toThrow();
    expect(() => new DocumentServerMetaCache({ getData, loadTimeoutMs: 2_147_483_648 })).toThrow(
      "loadTimeoutMs must be a whole number from 1 to 2147483647, got: 2147483648",
    );
    expect(() => new DocumentServerMetaCache({ getData, loadTimeoutMs: 5e9 })).toThrow(TypeError);
  });

  it("refuses a getData that may resolve to null or undefined", () => {
    // @ts-expect-error getData resolves to null
    new DocumentServerMetaCache({ getData: () => Promise.resolve(null) });
    // @ts-expect-error getData resolves to undefined
    new DocumentServerMetaCache({ getData: () => Promise.resolve(undefined) });
    // @ts-expect-error getData may resolve to null
    new DocumentServerMetaCache({ getData: (): Promise<Config | null> => Promise.resolve(null) });
    // @ts-expect-error the data type includes null
    new DocumentServerMetaCache<Config | null>({ getData: () => Promise.resolve(null) });
  });

  it("infers the types from the methods of a DocumentServerClient", () => {
    const client = new DocumentServerClient({ baseUrl: "https://docs.example.com" });

    const config = new DocumentServerMetaCache({
      getData: (signal) => client.getConfig({ signal }),
    });
    const formats = new DocumentServerMetaCache({
      getData: async (signal) => new DocumentServerFormats(await client.getFormats({ signal })),
    });
    const plain = new DocumentServerMetaCache({
      getData: () => client.getConfig(),
    });

    expectTypeOf(plain).toEqualTypeOf<DocumentServerMetaCache<ConfigResponse>>();
    expectTypeOf<ReturnType<DocumentServerMetaCache<ConfigResponse>["get"]>>().toEqualTypeOf<
      Promise<ConfigResponse | null>
    >();
    expectTypeOf(config).toEqualTypeOf<DocumentServerMetaCache<ConfigResponse>>();
    expectTypeOf(formats).toEqualTypeOf<DocumentServerMetaCache<DocumentServerFormats>>();
  });
});
