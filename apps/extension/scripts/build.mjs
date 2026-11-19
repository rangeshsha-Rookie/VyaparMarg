import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appDir, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(resolve(appDir, "manifest.json"), resolve(distDir, "manifest.json"));
await cp(resolve(appDir, "src"), resolve(distDir, "src"), { recursive: true });

console.log(`Built extension package: ${distDir}`);
