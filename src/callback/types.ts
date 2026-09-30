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
 * What happened to the document:
 *
 * - `1`: a user connected or disconnected;
 * - `2`: the last editor closed and the document changed;
 * - `3`: the document server failed to build the document;
 * - `4`: the last editor closed and nothing changed;
 * - `6`: the document was saved while it is edited;
 * - `7`: that save failed.
 *
 * Any other number is a status this SDK doesn't know yet.
 *
 * @see [Document statuses](https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#possible-document-statuses-and-their-description)
 */
export type CallbackStatus = 1 | 2 | 3 | 4 | 6 | 7 | (number & {});

/**
 * What started a save on status `6`:
 *
 * - `0`: the `forcesave` command;
 * - `1`: the save button;
 * - `2`: the autosave timer in the document server settings;
 * - `3`: a submitted form, whose data is at `formsdataurl`.
 *
 * @see [forcesavetype](https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/#forcesavetype)
 */
export type ForcesaveType = 0 | 1 | 2 | 3 | (number & {});

/** What a user did: `0` disconnected, `1` connected, `2` requested a save. */
export type CallbackActionType = 0 | 1 | 2 | (number & {});

/** Something a user did to the document. */
export interface CallbackAction {
  /** What the user did. */
  type: CallbackActionType;
  /** Identifier of the user, as the editor config named them. */
  userid: string;
}

/** The changes of the saved document, in the shape the editor's `refreshHistory` takes. */
export interface CallbackHistory {
  /** The changes, one entry for each. */
  changes: Record<string, unknown>[];
  /** The version of the document server that made them. */
  serverVersion: string;
}

/**
 * Body of a request the document server posts to the callback URL.
 *
 * @see [Callback handler](https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/)
 */
export interface CallbackBody {
  /** Key of the document, as the editor config gave it. */
  key: string;
  /** What happened to the document. */
  status: CallbackStatus;
  /** Where the document is downloaded from. Given with `2`, `3`, `6` and `7`. */
  url?: string;
  /** Extension of the file at `url`, without the dot. */
  filetype?: string;
  /** Where the archive of the changes is downloaded from. */
  changesurl?: string;
  /** The changes of the saved document. */
  history?: CallbackHistory;
  /** Identifiers of the users who have the document open. */
  users?: string[];
  /** What the users did. */
  actions?: CallbackAction[];
  /** When the document was last saved, as an ISO 8601 date. */
  lastsave?: string;
  /** Whether the document is saved with no change since the last save. */
  notmodified?: boolean;
  /** What started the save, on status `6` and `7`. */
  forcesavetype?: ForcesaveType;
  /** Where the data of a submitted form is downloaded from, as JSON. */
  formsdataurl?: string;
  /** What the command that asked for the save carried as `userdata`. */
  userdata?: string;
  /** Token the body is signed with, when the document server signs it in the body. */
  token?: string;
}

/** Status `1`: a user connected or disconnected. `actions` says which. */
export interface CallbackEditing extends CallbackBody {
  /** `"editing"`, the discriminant of {@link CallbackEvent}. */
  kind: "editing";
  /** Always `1`. */
  status: 1;
}

/** Status `2`: the last editor closed and the document changed. Download `url` and store it. */
export interface CallbackSave extends CallbackBody {
  /** `"save"`, the discriminant of {@link CallbackEvent}. */
  kind: "save";
  /** Always `2`. */
  status: 2;
  /** Where the document is downloaded from. Always given. */
  url: string;
}

/** Status `3`: the document server failed to build the document. `url` may be missing. */
export interface CallbackSaveError extends CallbackBody {
  /** `"save-error"`, the discriminant of {@link CallbackEvent}. */
  kind: "save-error";
  /** Always `3`. */
  status: 3;
}

/** Status `4`: the last editor closed and nothing changed. */
export interface CallbackClosed extends CallbackBody {
  /** `"closed"`, the discriminant of {@link CallbackEvent}. */
  kind: "closed";
  /** Always `4`. */
  status: 4;
}

/** Status `6`: the document was saved while it is edited. Download `url` and store a version. */
export interface CallbackForcesave extends CallbackBody {
  /** `"forcesave"`, the discriminant of {@link CallbackEvent}. */
  kind: "forcesave";
  /** Always `6`. */
  status: 6;
  /** Where the document is downloaded from. Always given. */
  url: string;
}

/** Status `7`: the save on status `6` failed. */
export interface CallbackForcesaveError extends CallbackBody {
  /** `"forcesave-error"`, the discriminant of {@link CallbackEvent}. */
  kind: "forcesave-error";
  /** Always `7`. */
  status: 7;
}

/** A status this SDK doesn't know yet. Read `status`. */
export interface CallbackUnknown extends CallbackBody {
  /** `"unknown"`, the discriminant of {@link CallbackEvent}. */
  kind: "unknown";
}

/** What the document server reports. A `switch` over `kind` narrows it. */
export type CallbackEvent =
  | CallbackClosed
  | CallbackEditing
  | CallbackForcesave
  | CallbackForcesaveError
  | CallbackSave
  | CallbackSaveError
  | CallbackUnknown;

/** The kind of an event, the discriminant of {@link CallbackEvent}. */
export type CallbackEventKind = CallbackEvent["kind"];

/** The reply to a callback: `0` handled, `1` not handled. */
export interface CallbackReply {
  /** `0` when the callback was handled, `1` when it was not. */
  readonly error: 0 | 1;
}
