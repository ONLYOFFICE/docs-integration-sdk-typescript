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

/** Fields every command carries. */
interface Command {
  /**
   * A token signed over this body, from {@link jwt!DocumentServerJwt.sign | DocumentServerJwt.sign()}.
   * Required once the document server has a JWT secret, unless the token is sent in a header.
   */
  token?: string;
}

/** Removes a document the editors left behind. */
export interface DeleteForgottenCommand extends Command {
  /** The command. */
  c: "deleteForgotten";
  /** Identifier of the forgotten document. */
  key: string;
}

/** Disconnects users from co-editing, leaving them with view access. */
export interface DropCommand extends Command {
  /** The command. */
  c: "drop";
  /** Identifier of the document. */
  key: string;
  /** Identifiers of the users to disconnect. Since Docs 8.3 omitting it drops every one of them. */
  users?: string[];
}

/** Saves the document being edited without closing it. */
export interface ForcesaveCommand extends Command {
  /** The command. */
  c: "forcesave";
  /** Identifier of the document. */
  key: string;
  /** Passed on to the callback handler, to tell concurrent requests apart. */
  userdata?: string;
}

/** Asks for the URL a forgotten document can be downloaded from. */
export interface GetForgottenCommand extends Command {
  /** The command. */
  c: "getForgotten";
  /** Identifier of the forgotten document. */
  key: string;
}

/** Lists the documents the editors left behind. */
export interface GetForgottenListCommand extends Command {
  /** The command. */
  c: "getForgottenList";
}

/** Asks who has the document open. */
export interface InfoCommand extends Command {
  /** The command. */
  c: "info";
  /** Identifier of the document. */
  key: string;
  /** Passed on to the callback handler, to tell concurrent requests apart. */
  userdata?: string;
}

/** Asks for the license and for the quota spent against it. */
export interface LicenseCommand extends Command {
  /** The command. */
  c: "license";
}

/** New metadata of a document. */
export interface DocumentMeta {
  /** Name of the document, extension included. */
  title: string;
}

/** Renames the document in every editor that has it open. */
export interface MetaCommand extends Command {
  /** The command. */
  c: "meta";
  /** Identifier of the document. */
  key: string;
  /** The new metadata. */
  meta: DocumentMeta;
}

/** Asks for the version of the document server. */
export interface VersionCommand extends Command {
  /** The command. */
  c: "version";
}

/**
 * The body of a request to `/command`, the command service: one of the commands, told apart by
 * `c`. Each command is checked against its own parameters.
 *
 * @see [Command service](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/)
 */
export type CommandRequest =
  | DeleteForgottenCommand
  | DropCommand
  | ForcesaveCommand
  | GetForgottenCommand
  | GetForgottenListCommand
  | InfoCommand
  | LicenseCommand
  | MetaCommand
  | VersionCommand;

/** Name of a command the service accepts. */
export type CommandType = CommandRequest["c"];

/** Terms of the license the document server runs under. */
export interface License {
  /** Editing connections the license allows. `0` when it counts users instead. */
  connections: number;
  /** Live viewer connections the license allows. */
  connections_view: number;
  /** Whether the editor interface may be customized. */
  customization: boolean;
  /** Expiry date of the license, in ISO 8601. */
  end_date: string;
  /** Whether the license is a trial one. */
  trial: boolean;
  /** Editing users the license allows. `0` when it counts connections instead. */
  users_count: number;
  /** Days a user stays counted against the quota. */
  users_expire: number;
  /** Live viewer users the license allows. */
  users_view_count: number;
}

/** Build of the document server, and the verdict on its license. */
export interface LicenseServer {
  /** Date the build was made, in ISO 8601. */
  buildDate: string;
  /** Build number. */
  buildNumber: number;
  /** Version of the build, such as `"8.2.0"`. */
  buildVersion: string;
  /** Edition: `0` community, `1` enterprise, `2` developer. */
  packageType: 0 | 1 | 2;
  /** State of the license: `1` error, `2` expired, `3` valid, `6` trial expired. */
  resultType: number;
}

/** A user counted against the license quota. */
export interface LicenseQuotaUser {
  /** Date the user stops being counted, in ISO 8601. */
  expire: string;
  /** Identifier of the user. */
  userid: string;
}

/** Users counted against the license since the document server was started. */
export interface LicenseQuota {
  /** Users who opened a document for editing. */
  users: LicenseQuotaUser[];
  /** Users who opened a document in the live viewer. */
  users_view: LicenseQuotaUser[];
}

/**
 * Why a command failed:
 *
 * - `0` no error
 * - `1` the document key is missing or too long
 * - `2` the callback url is incorrect
 * - `3` internal server error
 * - `4` nothing had changed since the last save, so `forcesave` did nothing
 * - `5` the command is unknown
 * - `6` invalid token
 *
 * A code the service doesn't document stays a plain number, so keep a `default` branch in a
 * `switch` over it.
 *
 * @see [Command service error codes](https://api.onlyoffice.com/docs/docs-api/additional-api/command-service/#possible-error-codes-and-their-description)
 */
export type CommandErrorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | (number & {});

/**
 * The body of a response from `/command`. Only `error` is always there. Which other fields come
 * depends on the command, and a failed command has the code alone.
 */
export interface CommandResponse {
  /** `0` on success, `4` when `forcesave` found nothing to save. See {@link CommandErrorCode}. */
  error: CommandErrorCode;
  /** Identifier of the document the command was about. */
  key?: string;
  /** Identifiers of the forgotten documents. Answers `getForgottenList`. */
  keys?: string[];
  /** The terms of the license. Answers `license`. */
  license?: License;
  /** The users counted against the license. Answers `license`. */
  quota?: LicenseQuota;
  /** The build of the document server and the state of its license. Answers `license`. */
  server?: LicenseServer;
  /** URL the forgotten document can be downloaded from. Answers `getForgotten`. */
  url?: string;
  /**
   * Identifiers of the users who have the document open for editing, or, once it has been
   * changed, of the one who edited it last. Answers `info`.
   */
  users?: string[];
  /** Version of the document server, such as `"8.2.0.1"`. Answers `version`. */
  version?: string;
}
