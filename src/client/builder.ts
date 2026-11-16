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

/**
 * Values the builder script reads back through its `Argument` global.
 *
 * @see [argument](https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/#argument)
 */
export type BuilderArgument = Record<string, unknown>;

/** Fields every request to the builder service carries. */
interface Builder {
  /**
   * Return as soon as the build is queued instead of waiting for it. Repeat the request
   * with the key it answered until `end` turns `true`. Default: `false`.
   */
  async?: boolean;
  /**
   * A token signed over this body, from {@link jwt!DocumentServerJwt.sign | DocumentServerJwt.sign()}.
   * Required once the document server has a JWT secret, unless the token is sent in a header.
   */
  token?: string;
}

/** Starts a build: the document server downloads the script and runs it. */
export interface BuildRequest extends Builder {
  /** Values for the script, read through its `Argument` global. */
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

/**
 * The body of a request to `/docbuilder`: {@link BuildRequest} starts a build,
 * {@link BuildResultRequest} collects an `async` one.
 *
 * @see [Document Builder API](https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/)
 */
export type BuilderRequest = BuildRequest | BuildResultRequest;

/**
 * The parameters of {@link DocumentServerClient.docbuilderFromFile}: those of
 * {@link BuildRequest} without `url`, since the script is sent in the request, and without
 * `key`, since the service creates one and answers `-3` to a request that has its own. A
 * `token` must carry `operation: "docbuilder"`.
 */
export type BuildFileRequest = Omit<BuildRequest, "key" | "url">;

/**
 * Why a build failed:
 *
 * - `-1` unknown error
 * - `-2` generation timeout
 * - `-3` generation error
 * - `-4` error while downloading the script or a file it opens
 * - `-6` error while accessing the generation result database
 * - `-8` invalid token
 *
 * A code the service doesn't document stays a plain number, so keep a `default` branch in a
 * `switch` over it.
 *
 * @see [Document Builder API error codes](https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/#possible-error-codes-and-their-description)
 */
export type BuilderErrorCode = -1 | -2 | -3 | -4 | -6 | -8 | (number & {});

/**
 * The body of a response from `/docbuilder` and `/docbuilder/from-file`: the state of the
 * build, or an `error` code and nothing else. The client throws on the code.
 *
 * @see [Response parameters](https://api.onlyoffice.com/docs/docs-api/additional-api/document-builder-api/#response-parameters)
 */
export interface BuilderResponse {
  /** Whether the build has finished. `urls` arrives along with it. */
  end?: boolean;
  /** The error code, on a failed build. See {@link BuilderErrorCode}. */
  error?: BuilderErrorCode;
  /** Identifier of the build, to be sent back in every request that follows. */
  key?: string;
  /** URL of each generated file, keyed by the name the script saved it under. */
  urls?: Record<string, string>;
}
