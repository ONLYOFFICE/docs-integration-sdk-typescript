import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const require = createRequire(import.meta.url);
const subpaths = Object.keys(manifest.exports).filter(
  (subpath) => subpath !== "." && subpath !== "./package.json",
);
const failures = [];

function check(format, root, modules) {
  const covered = new Set();

  for (const [subpath, module] of Object.entries(modules)) {
    for (const [name, value] of Object.entries(module)) {
      covered.add(name);

      if (root[name] !== value) {
        failures.push(`${format}: ${subpath} exports a ${name} the root does not share`);
      }
    }
  }

  for (const name of Object.keys(root)) {
    if (!covered.has(name)) {
      failures.push(`${format}: the root exports ${name}, which no subpath does`);
    }
  }
}

const esm = {};
const cjs = {};

for (const subpath of subpaths) {
  const specifier = `${manifest.name}${subpath.slice(1)}`;

  esm[subpath] = await import(specifier);
  cjs[subpath] = require(specifier);
}

check("esm", await import(manifest.name), esm);
check("cjs", require(manifest.name), cjs);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`${String(subpaths.length)} subpaths share every export with the root, in esm and cjs`);
