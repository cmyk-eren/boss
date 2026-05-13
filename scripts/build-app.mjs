import { spawnSync } from "node:child_process";

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
  console.log("[BOSS] RUN_DB_PUSH_ON_BUILD=true, running prisma db push before build");
  run("npm", ["run", "db:push"]);
}

run("next", ["build", "--webpack"]);
run("node", ["scripts/prepare-standalone.mjs"]);
