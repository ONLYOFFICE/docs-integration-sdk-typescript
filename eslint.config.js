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

import { defineConfig, globalIgnores } from "eslint/config";
import licenseHeader from "eslint-plugin-license-header";
import tseslint from "typescript-eslint";

const LICENSE = [
  ` * (c) Copyright Ascensio System SIA ${String(new Date().getFullYear())}`,
  " *",
  ' * Licensed under the Apache License, Version 2.0 (the "License");',
  " * you may not use this file except in compliance with the License.",
  " * You may obtain a copy of the License at",
  " *",
  " *     http://www.apache.org/licenses/LICENSE-2.0",
  " *",
  " * Unless required by applicable law or agreed to in writing, software",
  ' * distributed under the License is distributed on an "AS IS" BASIS,',
  " * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
  " * See the License for the specific language governing permissions and",
  " * limitations under the License.",
];

const LICENSE_HEADER = ["/**", " *", ...LICENSE, " *", " */"];

const MODULE_LICENSE_HEADER = ["/**", " *", ...LICENSE, " *", " * @license Apache-2.0", " */"];

export default defineConfig([
  globalIgnores(["dist/**", "coverage/**", "node_modules/**"]),
  tseslint.configs.strictTypeChecked,
  {
    plugins: { "license-header": licenseHeader },
    rules: {
      "license-header/header": ["error", LICENSE_HEADER],
    },
  },
  {
    files: ["src/*/index.ts"],
    rules: {
      "license-header/header": ["error", MODULE_LICENSE_HEADER],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["src/*/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./",
              message: "A module stands on its own: declare what it takes instead of importing it.",
            },
          ],
        },
      ],
    },
  },
]);
