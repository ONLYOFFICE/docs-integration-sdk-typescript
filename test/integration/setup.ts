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

import { execFileSync } from "node:child_process";
import { DOCS_URL, client } from "./env.js";

const COMPOSE = ["compose", "-f", "docker-compose.integration.yml"];
const STARTUP_MS = 300_000;

function compose(...args: string[]): void {
  execFileSync("docker", [...COMPOSE, ...args], { stdio: "inherit" });
}

async function waitUntilHealthy(): Promise<void> {
  const deadline = Date.now() + STARTUP_MS;

  for (;;) {
    if (await client.healthcheck({ timeoutMs: 5_000 }).catch(() => false)) {
      return;
    }

    if (Date.now() > deadline) {
      throw new Error(`the document server at ${DOCS_URL} did not become healthy in time`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

/** Starts the stack unless `DOCS_URL` names a server already running, and stops it after. */
export default async function setup(): Promise<() => void> {
  const managed = process.env["DOCS_URL"] === undefined;

  if (managed) {
    compose("up", "-d");
  }

  await waitUntilHealthy();

  return () => {
    if (managed && process.env["DOCS_KEEP"] === undefined) {
      compose("down");
    }
  };
}
