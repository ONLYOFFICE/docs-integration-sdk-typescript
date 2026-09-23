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
