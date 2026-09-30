# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `DocumentServerClient`, a typed client of the document server built on the standard
  `fetch`: `healthcheck()`, `getConfig()`, `getFormats()`, `convert()`,
  `convertFromFile()`, `command()`, `docbuilder()`, `docbuilderFromFile()` and `getFile()`.
- `DocumentServerRawClient`, on `client.raw`, which hands back the untouched `Response`.
- Per-request options: an abort signal, a timeout and headers of the request's own.
- `DocumentServerError` and its subclasses for HTTP, network, timeout and parse failures
  and for the error codes of the conversion, command and builder services, recognized
  without `instanceof` and carrying the url of the request.
- `splitFileUrl()`, which splits a location the document server handed out for `getFile()`.
- `DocumentServerFormats`, a lookup of the formats the server supports: document types,
  actions, conversions and mime types.
- `DocumentServerConfig`, which builds and signs the config an editor is opened with, and
  `buildDocumentKey()`, which builds a document key as the SHA-256 of its parts.
- `DocumentServerJwt`, which signs tokens for the body and the header, writes the
  operation claim, and checks the tokens the document server sends back.
- `DocumentServerCallback`, which checks and parses what the document server posts to the
  callback url, dispatches it to a handler for each status and builds the answer.
- A subpath for each module: `/client`, `/config`, `/formats`, `/jwt` and `/callback`.
- ESM and CJS builds with type definitions, and a markdown API reference in `docs/api/`.
