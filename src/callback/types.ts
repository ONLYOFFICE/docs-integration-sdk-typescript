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
 * What the document server reports of a document: `1` being edited, `2` ready to be saved,
 * `3` failed to be saved, `4` closed with no changes, `6` saved while being edited, `7`
 * failed to be saved while being edited.
 */
export type CallbackStatus = 1 | 2 | 3 | 4 | 6 | 7 | (number & {});

/**
 * What set a save off while the document was edited: `0` a command, `1` the save button,
 * `2` a timer, `3` a submitted form.
 */
export type ForcesaveType = 0 | 1 | 2 | 3 | (number & {});

/** What a user did: `0` disconnected, `1` connected, `2` asked for a save. */
export type CallbackActionType = 0 | 1 | 2 | (number & {});

/** Something a user did to the document. */
export interface CallbackAction {
  type: CallbackActionType;
  /** Identifier of the user, as the editor config named them. */
  userid: string;
}

/** The changes the saved document carries, as the editor's `refreshHistory` takes them. */
export interface CallbackHistory {
  changes: Record<string, unknown>[];
  serverVersion: string;
}

/** Body of a request the document server posts to the callback URL. */
export interface CallbackBody {
  /** Key of the document, as the editor config gave it. */
  key: string;
  status: CallbackStatus;
  /** Where the document is downloaded from. Given with `2`, `3`, `6` and `7`. */
  url?: string;
  /** Extension of the file at `url`, without the dot. */
  filetype?: string;
  /** Where the archive of the changes is downloaded from. */
  changesurl?: string;
  history?: CallbackHistory;
  /** Identifiers of the users who have the document open. */
  users?: string[];
  actions?: CallbackAction[];
  /** When the document was last saved, as an ISO 8601 date. */
  lastsave?: string;
  /** Whether the document is saved with no change since the last save. */
  notmodified?: boolean;
  forcesavetype?: ForcesaveType;
  /** Where the data of a submitted form is downloaded from, as JSON. */
  formsdataurl?: string;
  /** What the command that asked for the save carried as `userdata`. */
  userdata?: string;
  /** Token the body is signed with, when the document server signs it in the body. */
  token?: string;
}

/** The document is being edited: a user connected or disconnected. */
export interface CallbackEditing extends CallbackBody {
  kind: "editing";
  status: 1;
}

/** Every editor is closed and the document changed: download it from `url` and store it. */
export interface CallbackSave extends CallbackBody {
  kind: "save";
  status: 2;
  url: string;
}

/** The document server failed to build the document to be saved. */
export interface CallbackSaveError extends CallbackBody {
  kind: "save-error";
  status: 3;
}

/** Every editor is closed and nothing changed. */
export interface CallbackClosed extends CallbackBody {
  kind: "closed";
  status: 4;
}

/** The document was saved while being edited: download it from `url` and store it. */
export interface CallbackForcesave extends CallbackBody {
  kind: "forcesave";
  status: 6;
  url: string;
}

/** The document server failed to build the document saved while being edited. */
export interface CallbackForcesaveError extends CallbackBody {
  kind: "forcesave-error";
  status: 7;
}

/** A status this SDK does not know yet. */
export interface CallbackUnknown extends CallbackBody {
  kind: "unknown";
}

/** What the document server reports, told apart by `kind`. */
export type CallbackEvent =
  | CallbackClosed
  | CallbackEditing
  | CallbackForcesave
  | CallbackForcesaveError
  | CallbackSave
  | CallbackSaveError
  | CallbackUnknown;

/** Which of the events it is, and the discriminant of {@link CallbackEvent}. */
export type CallbackEventKind = CallbackEvent["kind"];

/** Body of the answer the document server expects: `0` taken, anything else to be retried. */
export interface CallbackReply {
  readonly error: 0 | 1;
}
