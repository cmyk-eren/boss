const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

process.env.PORT = port;
process.env.HOSTNAME = host;

console.log(`[BOSS] Starting standalone server on ${host}:${port}`);

await import("../.next/standalone/server.js");
