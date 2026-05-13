import { readdirSync, chmodSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function markExecutable(filePath) {
  try {
    chmodSync(filePath, 0o755);
    console.log(`[BOSS] Marked executable: ${filePath}`);
  } catch (error) {
    console.warn(
      `[BOSS] Could not mark executable: ${filePath}`,
      error instanceof Error ? error.message : error,
    );
  }
}

function ensurePrismaEnginePermissions() {
  const enginesDir = join(process.cwd(), "node_modules", "@prisma", "engines");

  try {
    const entries = readdirSync(enginesDir);

    for (const entry of entries) {
      const filePath = join(enginesDir, entry);
      const stats = statSync(filePath);

      if (!stats.isFile()) {
        continue;
      }

      if (
        entry.startsWith("schema-engine-") ||
        entry.startsWith("query-engine-") ||
        entry.startsWith("libquery_engine")
      ) {
        markExecutable(filePath);
      }
    }
  } catch (error) {
    console.warn(
      "[BOSS] Prisma engine permission preparation skipped:",
      error instanceof Error ? error.message : error,
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.RUN_DB_PUSH_ON_BUILD === "true") {
  ensurePrismaEnginePermissions();
  console.log("[BOSS] RUN_DB_PUSH_ON_BUILD=true, running prisma db push before build");
  run("npm", ["run", "db:push"]);
}

run("next", ["build", "--webpack"]);
run("node", ["scripts/prepare-standalone.mjs"]);
