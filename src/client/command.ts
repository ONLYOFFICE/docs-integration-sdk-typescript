/** Fields every command carries. */
interface Command {
  /** JWT signature of this body. Required once the document server has a secret. */
  token?: string;
}

/** Removes a document the editors left behind. */
export interface DeleteForgottenCommand extends Command {
  c: "deleteForgotten";
  /** Identifier of the forgotten document. */
  key: string;
}

/** Disconnects users from co-editing, leaving them with view access. */
export interface DropCommand extends Command {
  c: "drop";
  /** Identifier of the document. */
  key: string;
  /** Identifiers of the users to disconnect. Since Docs 8.3 omitting it drops every one of them. */
  users?: string[];
}

/** Saves the document being edited without closing it. */
export interface ForcesaveCommand extends Command {
  c: "forcesave";
  /** Identifier of the document. */
  key: string;
  /** Passed on to the callback handler, to tell concurrent requests apart. */
  userdata?: string;
}

/** Asks for the URL a forgotten document can be downloaded from. */
export interface GetForgottenCommand extends Command {
  c: "getForgotten";
  /** Identifier of the forgotten document. */
  key: string;
}

/** Lists the documents the editors left behind. */
export interface GetForgottenListCommand extends Command {
  c: "getForgottenList";
}

/** Asks who has the document open. */
export interface InfoCommand extends Command {
  c: "info";
  /** Identifier of the document. */
  key: string;
  /** Passed on to the callback handler, to tell concurrent requests apart. */
  userdata?: string;
}

/** Asks for the license and for the quota spent against it. */
export interface LicenseCommand extends Command {
  c: "license";
}

/** New metadata of a document. */
export interface DocumentMeta {
  /** Name of the document, extension included. */
  title: string;
}

/** Renames the document in every editor that has it open. */
export interface MetaCommand extends Command {
  c: "meta";
  /** Identifier of the document. */
  key: string;
  meta: DocumentMeta;
}

/** Asks for the version of the document server. */
export interface VersionCommand extends Command {
  c: "version";
}

/** Body of a request to the command service. */
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
 * A code the service does not document stays a number of its own rather than being forced
 * into the union, so a `switch` over it is never exhaustive.
 */
export type CommandErrorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | (number & {});

/**
 * Body of a response from the command service.
 *
 * Only `error` is always there; which of the rest arrive depends on the command that was
 * sent, and a failed command carries the code alone.
 */
export interface CommandResponse {
  error: CommandErrorCode;
  /** Identifier of the document the command was about. */
  key?: string;
  /** Identifiers of the forgotten documents. Answers `getForgottenList`. */
  keys?: string[];
  license?: License;
  quota?: LicenseQuota;
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
