import { spawnSync } from "node:child_process";

const project = process.argv[2];

if (!project) {
  console.error("Usage: bun scripts/react-doctor-score.mjs <project-directory>");
  process.exit(1);
}

const result = spawnSync(
  "bun",
  [
    "run",
    "--cwd",
    project,
    "react-doctor",
    "--score",
    "--offline",
    "--fail-on",
    "none"
  ],
  {
    encoding: "utf8"
  }
);

const stdout = result.stdout.trim();
const stderr = result.stderr.trim();

if (stderr) {
  console.error(stderr);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const scoreLine = stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => /^\d+(?:\.\d+)?$/.test(line));

const fallbackMatch = stdout.match(/score[^0-9]*(\d+(?:\.\d+)?)/i);
const score = scoreLine ?? fallbackMatch?.[1];

if (!score) {
  console.error("React Doctor did not return a parseable score.");
  console.error(stdout);
  process.exit(1);
}

console.log(score);
