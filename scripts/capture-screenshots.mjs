#!/usr/bin/env node
/**
 * Re-shoot every product screenshot from the running app.
 *
 * The screenshots in `docs/screenshots/` and `frontend/public/` are captures of
 * this app, not drawings, so anything that changes the UI makes them stale —
 * and stale text cannot be patched, only re-shot. This script is the way to
 * regenerate them so a rename never leaves the README and the landing page
 * showing a name the product no longer uses.
 *
 * Needs the app running: frontend on :3000, backend on the port
 * `frontend/.env.local` points at. Sign-in is a placeholder, so the run
 * authenticates itself.
 *
 *   node scripts/capture-screenshots.mjs              # everything
 *   node scripts/capture-screenshots.mjs meeting      # only names containing "meeting"
 *   node scripts/capture-screenshots.mjs --dry        # list what would be written
 *
 * Playwright is resolved from wherever it already lives rather than being a
 * dependency: this is a maintenance script, not part of the build.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = [
    "playwright",
    `${process.env.HOME}/.npm/_npx/705bc6b22212b352/node_modules/playwright`,
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try the next one */
    }
  }
  throw new Error("Playwright not found. `npx -y playwright@latest install chromium` first.");
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs/screenshots");
const PUBLIC = path.join(ROOT, "frontend/public");
const BASE = process.env.APP_URL || "http://127.0.0.1:3000";

/**
 * Every shot, with the state it needs. `scale` of 2 is what makes the 2800px
 * panels: they are 1400×880 viewports captured at 2×, so they stay sharp when
 * the landing page renders them 1200px wide.
 */
const SHOTS = [
  // The README and docs set — plain 1600×1000 viewports.
  { out: `${DOCS}/home.png`, path: "/home" },
  { out: `${DOCS}/notebook.png`, path: "/notebook" },
  { out: `${DOCS}/tasks.png`, path: "/tasks" },
  { out: `${DOCS}/search.png`, path: "/search" },
  { out: `${DOCS}/soundbites.png`, path: "/soundbites" },
  { out: `${DOCS}/analytics.png`, path: "/analytics" },
  { out: `${DOCS}/settings.png`, path: "/settings" },
  { out: `${DOCS}/uploads.png`, path: "/upload" },
  { out: `${DOCS}/login.png`, path: "/login", anon: true },
  { out: `${DOCS}/meeting.png`, meeting: true },
  { out: `${DOCS}/meeting-search.png`, meeting: true, find: "onboarding" },
  { out: `${DOCS}/dark-meeting.png`, meeting: true, dark: true },
  { out: `${DOCS}/dark-notebook.png`, path: "/notebook", dark: true },
  { out: `${DOCS}/landing.png`, path: "/", anon: true },

  // The landing page's own media.
  { out: `${PUBLIC}/hero-app.png`, meeting: true },
  { out: `${PUBLIC}/shot-dark-meeting.png`, meeting: true, dark: true },
  { out: `${PUBLIC}/panel-notes.png`, meeting: true, tab: "Notes", w: 1400, h: 880, scale: 2 },
  { out: `${PUBLIC}/panel-chapters.png`, meeting: true, tab: "Chapters", w: 1400, h: 880, scale: 2 },
  { out: `${PUBLIC}/panel-tasks.png`, path: "/tasks", w: 1400, h: 880, scale: 2 },
  { out: `${PUBLIC}/panel-people.png`, path: "/team", w: 1400, h: 880, scale: 2 },
  { out: `${PUBLIC}/panel-soundbites.png`, path: "/soundbites", w: 1400, h: 880, scale: 2 },
  { out: `${PUBLIC}/panel-upload.png`, path: "/upload", w: 1400, h: 880, scale: 2 },
];

const only = process.argv.slice(2).find((a) => !a.startsWith("--")) || "";
const dry = process.argv.includes("--dry");
const wanted = SHOTS.filter((s) => !only || path.basename(s.out).includes(only));

if (dry) {
  wanted.forEach((s) => console.log(path.relative(ROOT, s.out)));
  process.exit(0);
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true });

// One sign-in for the run. `ff-theme` has to be seeded before load: the theme
// provider reads it on mount, so toggling the class afterwards is undone.
const signIn = async (page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.click("text=Continue with Google");
  await page.waitForTimeout(3000);
};

const boot = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const bootPage = await boot.newPage();
await signIn(bootPage);
const meetings = await bootPage.evaluate(() =>
  [...document.querySelectorAll('a[href^="/view/"]')].map((a) => a.getAttribute("href")));
const MEETING = meetings[0];
if (!MEETING) throw new Error("No seeded meeting found — is the backend running and seeded?");
const session = await boot.storageState();
await boot.close();
console.log(`meeting: ${MEETING}`);

for (const s of wanted) {
  const ctx = await browser.newContext({
    viewport: { width: s.w || 1600, height: s.h || 1000 },
    deviceScaleFactor: s.scale || 1,
    ...(s.anon ? {} : { storageState: session }),
  });
  const page = await ctx.newPage();

  await page.addInitScript((dark) => {
    try {
      window.localStorage.setItem("ff-theme", dark ? "dark" : "light");
    } catch {
      /* private mode */
    }
  }, !!s.dark);

  await page.goto(BASE + (s.meeting ? MEETING : s.path), { waitUntil: "load" });
  await page.waitForTimeout(2600);

  if (s.tab) {
    const tab = await page.$(`button:has-text("${s.tab}"), [role="tab"]:has-text("${s.tab}")`);
    if (tab) {
      await tab.click();
      await page.waitForTimeout(1200);
    } else {
      console.warn(`  ! tab "${s.tab}" not found for ${path.basename(s.out)}`);
    }
  }
  if (s.find) {
    const box = await page.$('input[placeholder*="Find" i], input[placeholder*="Search" i]');
    if (box) {
      await box.fill(s.find);
      await page.waitForTimeout(1400);
    }
  }

  await page.waitForTimeout(600);
  fs.mkdirSync(path.dirname(s.out), { recursive: true });
  await page.screenshot({ path: s.out });
  await ctx.close();
  console.log(`  ${path.relative(ROOT, s.out)}${s.dark ? "  (dark)" : ""}`);
}

await browser.close();
