import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";

export const HOST_URL = process.env["HOST_URL"] ?? "http://host.docker.internal";

/** A request the document server made to the host. */
export interface HostRequest {
  path: string;
  headers: IncomingHttpHeaders;
}

/** A server in the test process the document server downloads from, recording what it asks. */
export interface Host {
  /** Where the document server reaches a file of the host. */
  url: (path: string) => string;
  requests: HostRequest[];
  close: () => Promise<void>;
}

/** Serves each of `files`, keyed by its path, and answers `404` to anything else. */
export async function startHost(files: Readonly<Record<string, string>>): Promise<Host> {
  const requests: HostRequest[] = [];
  const server = createServer((request, response) => {
    const path = request.url ?? "/";
    const body = files[path];

    requests.push({ path, headers: request.headers });

    if (body === undefined) {
      response.writeHead(404).end();

      return;
    }

    response.writeHead(200, { "content-type": "text/plain" }).end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, "0.0.0.0", resolve));

  const { port } = server.address() as AddressInfo;

  return {
    url: (path) => `${HOST_URL}:${String(port)}${path}`,
    requests,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }),
  };
}
