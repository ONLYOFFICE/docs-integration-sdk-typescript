import { DocumentServerNetworkError, DocumentServerTimeoutError } from "./errors.js";

/** What a request was sent with, as far as a failure to get its answer is concerned. */
export interface Attempt {
  url: string;
  timeoutMs: number;
  /** The signal of the caller, whose cancellation is theirs rather than a failure. */
  signal?: AbortSignal | undefined;
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError"
  );
}

/**
 * Turns what `fetch` or a body read rejected with into an error of the SDK. A call the
 * caller cancelled keeps the reason their signal carries, untouched.
 */
export function transportError(error: unknown, attempt: Attempt): unknown {
  if (attempt.signal?.aborted === true) {
    return error;
  }

  return isTimeout(error)
    ? new DocumentServerTimeoutError(attempt.url, attempt.timeoutMs, error)
    : new DocumentServerNetworkError(attempt.url, error);
}
