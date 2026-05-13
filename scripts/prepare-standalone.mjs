import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneRoot = join(process.cwd(), ".next", "standalone");
const standaloneNextRoot = join(standaloneRoot, ".next");
const sourceStatic = join(process.cwd(), ".next", "static");
const targetStatic = join(standaloneNextRoot, "static");
const sourcePublic = join(process.cwd(), "public");
const targetPublic = join(standaloneRoot, "public");

mkdirSync(standaloneNextRoot, { recursive: true });

if (existsSync(sourceStatic)) {
  cpSync(sourceStatic, targetStatic, { recursive: true, force: true });
  console.log("[BOSS] Copied .next/static into standalone output");
}

if (existsSync(sourcePublic)) {
  cpSync(sourcePublic, targetPublic, { recursive: true, force: true });
  console.log("[BOSS] Copied public assets into standalone output");
}
