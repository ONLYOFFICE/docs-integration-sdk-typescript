# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`@onlyoffice/docs-integration-sdk` — a TypeScript SDK for integrating ONLYOFFICE Docs: building
and signing the editor config, handling callbacks, and calling the conversion API, the command
service and the document builder. Built on the standard `fetch`, no HTTP dependencies; runs in
Node 20.19+, Deno, Bun, browsers and edge runtimes. The only runtime dependency is
`@onlyoffice/doceditor-types` (editor config types).

## Commands

```sh
npm run typecheck          # tsc --noEmit
npm test                   # unit tests (vitest, test/*.test.ts, mocked fetch)
npx vitest run test/jwt.test.ts          # one file
npx vitest run test/jwt.test.ts -t "name" # one test by name
npm run test:integration   # test/integration/** against a real document server in docker
npm run lint               # eslint (strictTypeChecked + license header)
npm run format:check       # prettier
npm run build              # tsup -> dist, ESM + CJS + .d.ts, one entry per module
npm run check:exports      # needs a build; subpaths vs src/ and vs the root
npm run docs               # typedoc -> docs/api (committed; CI fails if stale)
```

CI runs typecheck, lint, format:check, the docs diff, unit tests + build + check:exports on
Node 20/22/24, and the integration tests.

## Architecture

Each folder under `src/` with an `index.ts` is a **module** and a package subpath
(`@onlyoffice/docs-integration-sdk/<module>`): `client`, `config`, `formats`, `jwt`,
`callback`. The folder list is the single source of truth: tsup builds `src/*/index.ts`,
`package.json` exports `./*` onto `dist/*`, typedoc documents the same entries. `src/index.ts`
re-exports every module; adding a module means creating its folder and adding a line there
(`check:exports` fails otherwise).

**Modules do not import each other.** ESLint forbids `../` imports inside `src/*/`. Where one
module needs another, it declares a small structural interface and the caller passes the
concrete object:

- `config` takes a `FormatLookup` (satisfied by `DocumentServerFormats`) and signs through a
  `ConfigSigner` (satisfied by `DocumentServerJwt`);
- `callback` verifies through a `CallbackVerifier` (satisfied by `DocumentServerJwt`);
- `client` methods take an already-signed token as an argument instead of a signer.

Both `client` and `formats` declare a `Format` type; they must stay identical (a test enforces
it) and the root exports the one from `formats`.

`client` has two layers: `DocumentServerRawClient` (`raw.ts`) builds and sends requests and
returns the untouched `Response`; `DocumentServerClient` (`client.ts`) sends through `raw` and
parses, mapping failures to the error classes in `errors.ts` (HTTP, network, timeout, parse,
and per-API `ConversionError` / `CommandError` / `BuilderError` carrying the server's error
code). Request/response types live in `convert.ts`, `command.ts`, `builder.ts`, `meta.ts`.
Error code unions are open (`-1 | -2 | ... | (number & {})`) so unknown server codes still type.

Integration tests (`test/integration/`): `setup.ts` starts `docker-compose.integration.yml`
(document server with JWT secret `integration-secret` on `localhost:8080`, plus nginx serving
`fixtures/`), `host.ts` runs a server in the test process that the document server downloads
from via `host.docker.internal`. Env vars: `DOCS_URL` (use an already running server),
`DOCS_JWT_SECRET`, `FIXTURES_URL`, `HOST_URL`, `DOCS_KEEP` (leave the stack up).

## Conventions

- **Validate only the documented contract.** The SDK refuses only what the ONLYOFFICE API docs
  forbid or the server would reject. Best practices go into guides/doc comments, not validation.
- **No explanatory comments in implementation code.** Rationale goes in commit messages and
  docs. Doc comments on exported types, fields and methods are wanted — they are the exact
  contract and generate `docs/api/`. After changing an exported type or doc comment, run
  `npm run docs` and commit the result.
- Every source file starts with the Apache 2.0 header of Ascensio System SIA (checked by
  eslint, text in `eslint.config.js`, with the current year — the first lint of a new year
  fails everywhere until `npm run lint:fix`). Module entries `src/*/index.ts` end the header
  with `@license Apache-2.0` so typedoc reads the following `@module` comment instead.
- `docs/guides/` are hand-written, one task per guide, starting each section with code; they
  link the official ONLYOFFICE documentation rather than retelling it.
- Imports use `.js` extensions (NodeNext) and `import type` for types
  (`consistent-type-imports`, `verbatimModuleSyntax`).
- Commits follow Conventional Commits (`feat(client): ...`, `docs(guides): ...`).
