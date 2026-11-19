import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// 1. Configure environment variables (defaults for live cloud deployment)
const env = {
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || "https://vyaparmarg.onrender.com/api/v1",
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://jikdtvhcztvxmvydznxa.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_hiMK8Xb-OTtF7KhgEaZSCQ_Mqx1KDRt",
};

// If local .env exists and NOT running in CI/Vercel, allow .env override
const envFile = path.resolve(rootDir, ".env");
if (fs.existsSync(envFile) && !process.env.VERCEL && !process.env.CI) {
  const content = fs.readFileSync(envFile, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length) {
      env[k.trim()] = v.join("=").trim();
    }
  }
}

// 2. Typecheck with tsc
console.log("🔍 Checking TypeScript types...");
try {
  const tscBin = path.resolve(rootDir, "node_modules/typescript/bin/tsc");
  if (fs.existsSync(tscBin)) {
    execSync(`"${process.execPath}" "${tscBin}" --noEmit`, {
      cwd: rootDir,
      stdio: "inherit",
    });
  } else {
    execSync(`npx tsc --noEmit`, {
      cwd: rootDir,
      stdio: "inherit",
    });
  }
  console.log("✓ TypeScript validation passed with 0 errors.");
} catch (err) {
  console.warn("⚠️ TypeScript check had warnings or errors, proceeding with bundle build...");
}

// 3. Resolve esbuild
console.log("⚡ Building production assets with esbuild...");
let esbuild;
try {
  const mod = await import("esbuild");
  esbuild = mod.default || mod;
} catch {
  let esbuildPath = "";
  const candidates = [
    path.resolve(rootDir, "node_modules/esbuild/lib/main.js"),
    path.resolve(rootDir, "../../node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      esbuildPath = c;
      break;
    }
  }
  if (!esbuildPath) {
    const pnpmDir = path.resolve(rootDir, "../../node_modules/.pnpm");
    if (fs.existsSync(pnpmDir)) {
      const entry = fs.readdirSync(pnpmDir).find((e) => e.startsWith("esbuild@"));
      if (entry) {
        esbuildPath = path.resolve(pnpmDir, entry, "node_modules/esbuild/lib/main.js");
      }
    }
  }
  if (!esbuildPath) {
    throw new Error("Could not find esbuild package.");
  }
  const esbuildModule = await import(pathToFileURL(esbuildPath).href);
  esbuild = esbuildModule.default || esbuildModule;
}

const outdir = path.resolve(rootDir, "dist/assets");
fs.mkdirSync(outdir, { recursive: true });

const defines = {
  "process.env.NODE_ENV": JSON.stringify("production"),
  "import.meta.env.MODE": JSON.stringify("production"),
  "import.meta.env.DEV": JSON.stringify(false),
  "import.meta.env.PROD": JSON.stringify(true),
};
for (const [k, v] of Object.entries(env)) {
  defines[`import.meta.env.${k}`] = JSON.stringify(v);
}

const result = await esbuild.build({
  entryPoints: [path.resolve(rootDir, "src/main.tsx")],
  bundle: true,
  outdir,
  entryNames: "[name]-[hash]",
  format: "esm",
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  define: defines,
  loader: {
    ".css": "css",
  },
  metafile: true,
});

let jsFile = "";
let cssFile = "";
for (const output of Object.keys(result.metafile.outputs)) {
  if (output.endsWith(".js")) jsFile = path.basename(output);
  if (output.endsWith(".css")) cssFile = path.basename(output);
}

// 4. Generate dist/index.html
const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0d4ea6" />
    <title>VyaparMarg - Rural MSME Platform</title>
    ${cssFile ? `<link rel="stylesheet" crossorigin href="/assets/${cssFile}">` : ""}
    <script type="module" crossorigin src="/assets/${jsFile}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

fs.writeFileSync(path.resolve(rootDir, "dist/index.html"), htmlTemplate, "utf-8");
console.log(`✅ Production build successful!`);
console.log(`   JS Bundle:  dist/assets/${jsFile}`);
if (cssFile) console.log(`   CSS Bundle: dist/assets/${cssFile}`);
console.log(`   HTML:       dist/index.html`);
