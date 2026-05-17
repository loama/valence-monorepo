import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const drizzleDir = new URL("../drizzle", import.meta.url);
const supabaseDir = new URL("../supabase/migrations", import.meta.url);

await mkdir(supabaseDir, { recursive: true });

for (const entry of await readdir(drizzleDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const migrationName = entry.name;
  const sourcePath = join(drizzleDir.pathname, migrationName, "migration.sql");
  const destinationPath = join(supabaseDir.pathname, `${migrationName}.sql`);

  try {
    await stat(sourcePath);
  } catch {
    continue;
  }

  await copyFile(sourcePath, destinationPath);
  console.log(`synced ${migrationName}.sql`);
}
