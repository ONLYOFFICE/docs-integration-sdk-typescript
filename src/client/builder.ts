/** Values the builder script reads back through its `Argument` global. */
export type BuilderArgument = Record<string, unknown>;

/** Fields every request to the builder service carries. */
interface Builder {
  /**
   * Return as soon as the build is queued instead of waiting for it. Repeat the request
   * with the key it answered until `end` turns `true`. Default: `false`.
   */
  async?: boolean;
  /** JWT signature of this body. Required once the document server has a secret. */
  token?: string;
}

/** Starts a build: the document server downloads the script and runs it. */
export interface BuildRequest extends Builder {
  argument?: BuilderArgument;
  /** Identifier of the build. The service mints one of its own when it is left out. */
  key?: string;
  /** Absolute URL of the `.js` script to run. */
  url: string;
}

/** Collects the result of an asynchronous build. */
export interface BuildResultRequest extends Builder {
  /** Identifier of the build, as the service returned it. */
  key: string;
}

/** Body of a request to the builder service. */
export type BuilderRequest = BuildRequest | BuildResultRequest;

/**
 * Why a build failed:
 *
 * - `-1` unknown error
 * - `-2` generation timeout
 * - `-3` generation error
 * - `-4` error while downloading the script or a file it opens
 * - `-6` error while accessing the generation result database
 * - `-8` invalid token
 */
export type BuilderErrorCode = -1 | -2 | -3 | -4 | -6 | -8;

/**
 * Body of a response from the builder service.
 *
 * Either the build reports its state or it reports an `error`, so a body that carries a
 * code carries nothing else.
 */
export interface BuilderResponse {
  /** Whether the build has finished. `urls` arrives along with it. */
  end?: boolean;
  error?: BuilderErrorCode;
  /** Identifier of the build, to be sent back in every request that follows. */
  key?: string;
  /** URL of each generated file, keyed by the name the script saved it under. */
  urls?: Record<string, string>;
}
