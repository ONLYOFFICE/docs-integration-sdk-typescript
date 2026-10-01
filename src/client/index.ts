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
 * @license Apache-2.0
 */

/**
 * The HTTP client of the document server: conversion, commands, the document builder,
 * downloading files, the health check and what the server says of itself. Imported from
 * `@onlyoffice/docs-integration-sdk/client`.
 *
 * @see [Client options](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/client.md)
 * @see [Converting documents](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/conversion.md)
 * @see [Commands](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/commands.md)
 * @see [Document builder](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/document-builder.md)
 * @see [Downloading files](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/files.md)
 * @see [Errors](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/errors.md)
 * @module client
 */

export * from "./builder.js";
export * from "./client.js";
export * from "./command.js";
export * from "./convert.js";
export * from "./errors.js";
export * from "./file.js";
export * from "./meta.js";
export * from "./options.js";
export * from "./raw.js";
