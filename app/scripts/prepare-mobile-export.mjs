import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const outDir = join(process.cwd(), "out");
const appHtml = join(outDir, "app.html");

async function copyHtmlToIndex(source, destinationDirectory) {
  await mkdir(destinationDirectory, { recursive: true });
  await copyFile(source, join(destinationDirectory, "index.html"));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".html")) {
      continue;
    }

    const relativePath = relative(outDir, absolutePath);

    if (
      !relativePath.startsWith(`app/`) ||
      relativePath === "app.html" ||
      relativePath.endsWith("/index.html")
    ) {
      continue;
    }

    await copyHtmlToIndex(
      absolutePath,
      join(outDir, relativePath.replace(/\.html$/, ""))
    );
  }
}

await copyFile(appHtml, join(outDir, "index.html"));
await copyHtmlToIndex(appHtml, join(outDir, "app"));
await walk(join(outDir, "app"));
