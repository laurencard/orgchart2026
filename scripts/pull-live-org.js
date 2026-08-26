/**
 * Pull the live shared org chart from production into data/org-chart-live.json
 * so Cursor can stay in sync with team edits.
 *
 * Usage:
 *   node scripts/pull-live-org.js
 *   ORG_CHART_URL=https://your-app.vercel.app node scripts/pull-live-org.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outPath = path.join(root, "data", "org-chart-live.json");
const urlFile = path.join(__dirname, "live-url.txt");

function readUrlFile() {
  if (!fs.existsSync(urlFile)) return "";
  return fs
    .readFileSync(urlFile, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#")) || "";
}

function origin() {
  const raw = (process.env.ORG_CHART_URL || readUrlFile()).trim().replace(/\/$/, "");
  if (!raw) {
    console.error("Set ORG_CHART_URL or put the production origin in scripts/live-url.txt");
    process.exit(1);
  }
  return raw.replace(/\/api\/org-chart$/i, "");
}

async function main() {
  const url = `${origin()}/api/org-chart`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error(`Fetch failed ${res.status} ${url}`);
    process.exit(1);
  }
  const data = await res.json();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
  const updated = data.updated_at || data.payload && "payload present";
  console.log("Wrote", outPath, updated ? `(${updated})` : "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
