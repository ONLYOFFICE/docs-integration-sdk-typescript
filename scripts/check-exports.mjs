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

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const require = createRequire(import.meta.url);
const failures = [];

async function directories(path) {
  const entries = await readdir(new URL(path, root), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const modules = (await directories("src/")).filter((name) =>
  existsSync(new URL(`src/${name}/index.ts`, root)),
);

for (const name of await directories("dist/")) {
  if (!modules.includes(name)) {
    failures.push(`dist/${name} is a subpath, yet src/${name}/index.ts is no module`);
  }
}

function check(format, entry, subpaths) {
  const covered = new Set();

  for (const [subpath, module] of Object.entries(subpaths)) {
    for (const [name, value] of Object.entries(module)) {
      covered.add(name);

      if (entry[name] !== value) {
        failures.push(`${format}: /${subpath} exports a ${name} the root does not share`);
      }
    }
  }

  for (const name of Object.keys(entry)) {
    if (!covered.has(name)) {
      failures.push(`${format}: the root exports ${name}, which no subpath does`);
    }
  }
}

const esm = {};
const cjs = {};

for (const name of modules) {
  const specifier = `${manifest.name}/${name}`;

  esm[name] = await import(specifier);
  cjs[name] = require(specifier);
}

check("esm", await import(manifest.name), esm);
check("cjs", require(manifest.name), cjs);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`${String(modules.length)} subpaths share every export with the root, in esm and cjs`);
