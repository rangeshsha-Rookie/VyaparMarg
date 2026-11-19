import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.resolve(rootDir, "docs/assets");

const puppeteerPath = path.resolve(
  rootDir,
  "node_modules/.pnpm/puppeteer-core@25.18.1/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js"
);
const puppeteerModule = await import(pathToFileURL(puppeteerPath).href);
const puppeteer = puppeteerModule.default || puppeteerModule;

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  console.log("🚀 Launching Edge browser via Puppeteer Core...");
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();
  console.log("🌐 Navigating to https://vyapar-marg.vercel.app/ ...");
  await page.goto("https://vyapar-marg.vercel.app/", { waitUntil: "networkidle2", timeout: 30000 });

  // 1. Screenshot Login screen with Demo mode button
  const loginPath = path.resolve(assetsDir, "deployed_01_login_mode.png");
  await page.screenshot({ path: loginPath });
  console.log(`📸 1. Login Screen saved: ${loginPath}`);

  // 2. Click the Demo button
  console.log("⚡ Clicking Explore Demo Mode...");
  const demoButton = await page.waitForSelector("button::-p-text(Explore Demo Mode)");
  if (demoButton) {
    await demoButton.click();
  } else {
    // fallback click on button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent.includes("Demo Mode") || x.textContent.includes("Savita"));
      if (b) b.click();
    });
  }

  // Wait for dashboard to load
  await page.waitForFunction(() => document.querySelector(".app-page") !== null || document.querySelector(".topbar") !== null, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1200));

  // 2. Screenshot AI Assistant tab
  const assistantPath = path.resolve(assetsDir, "deployed_02_dashboard_assistant.png");
  await page.screenshot({ path: assistantPath });
  console.log(`📸 2. AI Assistant Tab saved: ${assistantPath}`);

  // Helper to click tab
  async function clickTab(tabText) {
    await page.evaluate((text) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes(text));
      if (btn) btn.click();
    }, tabText);
    await new Promise((r) => setTimeout(r, 800));
  }

  // 3. Screenshot Schemes tab
  console.log("🏛️ Navigating to Schemes tab...");
  await clickTab("Schemes");
  const schemesPath = path.resolve(assetsDir, "deployed_03_schemes_recommendations.png");
  await page.screenshot({ path: schemesPath });
  console.log(`📸 3. Schemes Recommendations saved: ${schemesPath}`);

  // 4. Screenshot Markets tab
  console.log("🛒 Navigating to Markets tab...");
  await clickTab("Markets");
  const marketsPath = path.resolve(assetsDir, "deployed_04_marketplaces_ondc_gem.png");
  await page.screenshot({ path: marketsPath });
  console.log(`📸 4. Markets & ONDC saved: ${marketsPath}`);

  // 5. Screenshot Tools tab
  console.log("📱 Navigating to Tools tab...");
  await clickTab("Tools");
  const toolsPath = path.resolve(assetsDir, "deployed_05_digital_tools.png");
  await page.screenshot({ path: toolsPath });
  console.log(`📸 5. Digital Tools saved: ${toolsPath}`);

  // 6. Screenshot Portals tab
  console.log("🌐 Navigating to Portals tab...");
  await clickTab("Portals");
  const portalsPath = path.resolve(assetsDir, "deployed_06_portal_guides.png");
  await page.screenshot({ path: portalsPath });
  console.log(`📸 6. Portal Guides saved: ${portalsPath}`);

  // 7. Screenshot Growth tab
  console.log("📊 Navigating to Growth tab...");
  await clickTab("Growth");
  const growthPath = path.resolve(assetsDir, "deployed_07_growth_dashboard.png");
  await page.screenshot({ path: growthPath });
  console.log(`📸 7. Growth Dashboard saved: ${growthPath}`);

  await browser.close();
  console.log("🎉 All live screenshots successfully captured from deployed Vercel site!");
}

run().catch((err) => {
  console.error("❌ Error capturing screenshots:", err);
  process.exit(1);
});
