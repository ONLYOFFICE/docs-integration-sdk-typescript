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

const DEFAULT_TTL_MS = 86_400_000;
const DEFAULT_RETRY_MS = 60_000;
const DEFAULT_LOAD_TIMEOUT_MS = 60_000;

/** Settings of a {@link DocumentServerMetaCache}. */
export interface MetaCacheOptions<T extends object> {
  /**
   * Loads the data, such as `(signal) => client.getConfig({ signal })` or
   * `async (signal) => new DocumentServerFormats(await client.getFormats({ signal }))`. Required.
   * Called whenever {@link DocumentServerMetaCache.get} finds the data stale or missing. The cache
   * holds what it resolves to as is and hands the same object to every call of `get()`. Resolves
   * to an object, never to `null`, so that `get()` resolves to `null` only while nothing has loaded.
   *
   * @param signal Aborted with a `DOMException` named `"TimeoutError"` once the load has run for
   * `loadTimeoutMs`. Pass it on to cancel the work of a load the cache no longer waits for.
   */
  getData(signal: AbortSignal): Promise<T>;
  /** How long loaded data is fresh, in whole milliseconds from `1`. Default: `86400000`, a day. */
  ttlMs?: number;
  /**
   * How long to wait after a failed load before {@link DocumentServerMetaCache.get} starts
   * another, in whole milliseconds from `0`. Default: `60000`, a minute.
   */
  retryMs?: number;
  /**
   * How long a load may run, in whole milliseconds from `1` to `2147483647`, the longest delay
   * timers support. Default: `60000`, a minute. A load that hasn't ended by then counts as
   * failed: the signal passed to `getData` is aborted, a `DOMException` named `"TimeoutError"`
   * goes to `onError`, the call waiting for the load resolves to the old data, and what the load
   * ends with later is ignored.
   */
  loadTimeoutMs?: number;
  /** Called with the error of a failed load. */
  onError?: (error: unknown) => void;
}

const MAX_TIMER_MS = 2_147_483_647;

function assertWhole(
  name: string,
  value: number,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (Number.isSafeInteger(value) && value >= min && value <= max) {
    return value;
  }

  const range =
    max === Number.MAX_SAFE_INTEGER
      ? `from ${String(min)}`
      : `from ${String(min)} to ${String(max)}`;

  throw new TypeError(`${name} must be a whole number ${range}, got: ${String(value)}`);
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(signal.reason as DOMException);
    };

    signal.addEventListener("abort", onAbort, { once: true });
    void promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
}

/**
 * Keeps one answer of a document server in memory, such as `/meta/config` or `/meta/formats`,
 * so that a request to your application doesn't cost one to the document server. Create one
 * cache per answer.
 *
 * A call to {@link DocumentServerMetaCache.get} that finds the data stale or missing starts a
 * load and waits for it; calls made while a load runs don't wait and get what is cached, or
 * `null` before the first load succeeds. A failed load keeps the old data and is not retried for
 * `retryMs`; a load still running after `loadTimeoutMs` is aborted and counts as failed.
 *
 * The cache sends no requests of its own: loads start only from `get()`.
 *
 * @example
 * ```ts
 * const formats = new DocumentServerMetaCache({
 *   getData: async (signal) => new DocumentServerFormats(await client.getFormats({ signal })),
 * });
 *
 * (await formats.get())?.isEditable("docx");
 * ```
 *
 * @see [Caching the server configuration](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/cache.md)
 */
export class DocumentServerMetaCache<T extends object> {
  readonly #getData: (signal: AbortSignal) => Promise<T>;
  readonly #ttlMs: number;
  readonly #retryMs: number;
  readonly #onError: ((error: unknown) => void) | undefined;
  readonly #loadTimeoutMs: number;
  #data: T | null = null;
  #freshUntil = 0;
  #retryAt = 0;
  #loadId = 0;
  #loadDeadline: number | null = null;

  /**
   * @param options Where the data comes from, and how long it is kept.
   * @throws {TypeError} when `ttlMs`, `retryMs` or `loadTimeoutMs` is out of its range.
   */
  constructor(options: MetaCacheOptions<T>) {
    this.#ttlMs = assertWhole("ttlMs", options.ttlMs ?? DEFAULT_TTL_MS, 1);
    this.#retryMs = assertWhole("retryMs", options.retryMs ?? DEFAULT_RETRY_MS, 0);
    this.#loadTimeoutMs = assertWhole(
      "loadTimeoutMs",
      options.loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT_MS,
      1,
      MAX_TIMER_MS,
    );
    this.#getData = (signal) => options.getData(signal);
    this.#onError = options.onError;
  }

  /**
   * Resolves to the cached data, or `null` while nothing has loaded yet. When the data is stale
   * or missing, no load runs and the last one didn't fail less than `retryMs` ago, starts a
   * load and resolves once it ends: to the new data, or, when the load fails, to the old.
   * Otherwise resolves at once. Never rejects.
   */
  async get(): Promise<T | null> {
    const now = Date.now();

    if (this.#loadDeadline !== null) {
      if (now < this.#loadDeadline) {
        return this.#data;
      }

      this.#loadId += 1;
      this.#loadDeadline = null;
      this.#fail(
        now,
        new DOMException(
          `The load did not end within ${String(this.#loadTimeoutMs)} ms`,
          "TimeoutError",
        ),
      );
    }

    if (now >= this.#freshUntil && now >= this.#retryAt) {
      await this.#load(now);
    }

    return this.#data;
  }

  async #load(now: number): Promise<void> {
    this.#loadId += 1;
    const id = this.#loadId;
    this.#loadDeadline = now + this.#loadTimeoutMs;
    const signal = AbortSignal.timeout(this.#loadTimeoutMs);

    try {
      const data = await abortable(this.#getData(signal), signal);

      if (id === this.#loadId) {
        this.#data = data;
        this.#freshUntil = Date.now() + this.#ttlMs;
        this.#retryAt = 0;
      }
    } catch (error) {
      if (id === this.#loadId) {
        this.#fail(Date.now(), error);
      }
    } finally {
      if (id === this.#loadId) {
        this.#loadDeadline = null;
      }
    }
  }

  #fail(now: number, error: unknown): void {
    this.#retryAt = now + this.#retryMs;
    this.#report(error);
  }

  #report(error: unknown): void {
    try {
      this.#onError?.(error);
    } catch {
      return;
    }
  }
}
