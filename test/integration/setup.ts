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
