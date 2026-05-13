import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

console.log(`[BOSS] Starting Next.js on ${host}:${port}`);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "--hostname", host, "--port", port],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
