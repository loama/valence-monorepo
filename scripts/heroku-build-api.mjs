import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const candidates = [
  "node_modules/typescript/bin/tsc",
  "api/node_modules/typescript/bin/tsc"
];

const tsc = candidates.find((candidate) => existsSync(candidate));

if (!tsc) {
  console.error("Could not find TypeScript. Install root or api dependencies first.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsc, "-p", "api/tsconfig.json"], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);
