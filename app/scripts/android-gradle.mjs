import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const androidDir = resolve(__dirname, "../android");
const bundledJdk = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";

const env = { ...process.env };

if (!env.JAVA_HOME && existsSync(bundledJdk)) {
  env.JAVA_HOME = bundledJdk;
  env.PATH = `${bundledJdk}/bin:${env.PATH ?? ""}`;
}

const args = process.argv.slice(2);
const gradleArgs = args.length > 0 ? args : ["assembleDebug"];
const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const result = spawnSync(gradle, gradleArgs, {
  cwd: androidDir,
  env,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
