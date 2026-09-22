/** Where the document server expects the JWT of a request. */
export interface ConfigAuthorization {
  /** Name of the header carrying the token, such as `"Authorization"`. */
  header: string;
  /** Prefix the token is written behind, such as `"Bearer "`. */
  prefix: string;
}

/** Paths of the endpoints the document server serves, relative to its base URL. */
export interface ConfigUrls {
  /** Script that loads the editor API, such as `"/web-apps/apps/api/documents/api.js"`. */
  api: string;
  command: string;
  converter: string;
  docbuilder: string;
}

/** Bounds the document server enforces. */
export interface ConfigLimits {
  /** Largest file it accepts, in bytes. */
  maxFileSize: number;
}

/** Body of a response from the configuration endpoint. */
export interface ConfigResponse {
  authorization: ConfigAuthorization;
  /** Language tags the editor interface is translated into, such as `"pt-PT"`. */
  langs: string[];
  limits: ConfigLimits;
  urls: ConfigUrls;
}
