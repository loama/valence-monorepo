import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const releaseVersionPath = join(currentDirectory, "..", "release-version.json");
const releaseVersion = JSON.parse(readFileSync(releaseVersionPath, "utf8"));
const nextVersion = Number(releaseVersion.version) + 1;

if (!Number.isInteger(nextVersion) || nextVersion < 1) {
  throw new Error("release-version.json must contain a positive integer version.");
}

writeFileSync(
  releaseVersionPath,
  `${JSON.stringify({ version: nextVersion }, null, 2)}\n`
);

console.log(`Valence app release version bumped to ${nextVersion}`);
