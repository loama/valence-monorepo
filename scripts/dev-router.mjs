import { spawn } from "node:child_process";
import { createServer } from "node:net";

const routerPort = Number(process.env.VALENCE_DEV_PORT ?? 3005);
const upstreams = {
  website: {
    port: 3000,
    readyText: "Ready"
  },
  app: {
    port: 3001,
    readyText: "Ready"
  },
  admin: {
    port: 3002,
    readyText: "Ready"
  }
};

const children = [];
const ready = new Set();
let routerServer;
let shuttingDown = false;

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
}

async function assertPortsAvailable() {
  const requiredPorts = [
    ["router", routerPort],
    ...Object.entries(upstreams).map(([name, upstream]) => [
      name,
      upstream.port
    ])
  ];

  const busyPorts = [];

  for (const [name, port] of requiredPorts) {
    if (!(await canListen(port))) {
      busyPorts.push(`${name} :${port}`);
    }
  }

  if (busyPorts.length > 0) {
    console.error(
      `[router] ports already in use: ${busyPorts.join(", ")}. ` +
        "Stop the existing dev server or change VALENCE_DEV_PORT."
    );
    process.exit(1);
  }
}

function prefixLines(name, stream) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.includes(upstreams[name].readyText)) {
        ready.add(name);
      }

      if (line.trim()) {
        console.log(`[${name}] ${line}`);
      }
    }
  });
}

function startWorkspace(name) {
  const child = spawn("bun", ["run", "dev"], {
    cwd: new URL(`../${name}`, import.meta.url),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.push(child);
  prefixLines(name, child.stdout);
  prefixLines(name, child.stderr);

  child.on("exit", (code, signal) => {
    if (signal) {
      return;
    }

    console.error(`[${name}] exited with code ${code ?? 1}`);
    shutdown(code ?? 1);
  });
}

function chooseUpstream(pathname) {
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return upstreams.app;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return upstreams.admin;
  }

  return upstreams.website;
}

async function proxyRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstream = chooseUpstream(incomingUrl.pathname);
  const targetUrl = new URL(request.url);

  targetUrl.protocol = "http:";
  targetUrl.hostname = "127.0.0.1";
  targetUrl.port = String(upstream.port);

  const headers = new Headers(request.headers);
  headers.set("host", `127.0.0.1:${upstream.port}`);
  headers.set("x-forwarded-host", `localhost:${routerPort}`);
  headers.set("x-forwarded-proto", "http");

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "manual"
  });
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  routerServer?.stop(true);
  process.exit(code);
}

await assertPortsAvailable();

try {
  routerServer = Bun.serve({
    port: routerPort,
    idleTimeout: 120,
    async fetch(request) {
      try {
        return await proxyRequest(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        return new Response(`Valence dev router upstream failed: ${message}`, {
          status: 502
        });
      }
    }
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[router] failed to start on :${routerPort}: ${message}`);
  process.exit(1);
}

for (const name of Object.keys(upstreams)) {
  startWorkspace(name);
}

console.log(`[router] http://localhost:${routerPort}`);
console.log(`[router] routes: / -> website, /app -> app, /admin -> admin`);

const readyTimer = setInterval(() => {
  if (ready.size === Object.keys(upstreams).length) {
    console.log(`[router] all workspaces ready`);
    clearInterval(readyTimer);
  }
}, 250);

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
