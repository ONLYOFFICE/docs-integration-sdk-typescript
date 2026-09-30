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

import { DocumentServerNetworkError, DocumentServerTimeoutError } from "./errors.js";

export interface Attempt {
  url: string;
  timeoutMs: number;
  signal?: AbortSignal | undefined;
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError"
  );
}

export function transportError(error: unknown, attempt: Attempt): unknown {
  if (attempt.signal?.aborted === true) {
    return error;
  }

  return isTimeout(error)
    ? new DocumentServerTimeoutError(attempt.url, attempt.timeoutMs, error)
    : new DocumentServerNetworkError(attempt.url, error);
}
