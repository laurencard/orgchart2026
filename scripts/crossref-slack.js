const fs = require("fs");
const path = require("path");

const csvPath = "C:/Users/lauren/Downloads/slack-nftydoor-members.csv";
const htmlPath = path.join(__dirname, "..", "index.html");
const outJson = path.join(__dirname, "slack-unallocated.json");
const outSnippet = path.join(__dirname, "unallocated-seed-snippet.js");

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCSVLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cols = parseCSVLine(l);
    const o = {};
    header.forEach((h, i) => (o[h] = cols[i] || ""));
    return o;
  });
}

function stripNoise(name) {
  if (!name) return "";
  let n = String(name).trim();
  n = n.replace(/\s*\([^)]*\)\s*/g, " ");
  // schedules / shifts trailing after hyphen or emdash
  n = n.replace(/\s*[-–—]\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Training|CXM|PQ|Processing|Closing|Partner Care|NFTY).*$/i, "");
  n = n.replace(/\s+\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?\s*[-–]\s*\d{1,2}.*$/i, "");
  n = n.replace(/\s+\d{1,2}(-|–)\d{1,2}\s*(AM|PM|am|pm|PST|EST|CST|MST|ET|PT)?.*$/i, "");
  n = n.replace(/\s+\d{1,2}a-\d{1,2}p\b.*$/i, "");
  n = n.replace(/\s+(PST|EST|CST|MST|ET|PT|UTC)\b.*$/i, "");
  n = n.replace(/\s*[,/]\s*(Processing|Title|CXM|DTI|Closing|Insurance|Concierge|NFTY Support).*$/i, "");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

function pickBestName(r) {
  const full = stripNoise(r.fullname);
  const display = stripNoise(r.displayname);
  const user = stripNoise(r.username);
  // Prefer fuller real names over nicknames / single tokens
  const candidates = [full, display].filter(Boolean);
  candidates.sort((a, b) => {
    const ta = a.split(/\s+/).length;
    const tb = b.split(/\s+/).length;
    if (tb !== ta) return tb - ta;
    return b.length - a.length;
  });
  const best = candidates[0] || user || r.username;
  // Title-case lightly if all lower / weird
  return best;
}

function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(name) {
  return normalizeName(name).split(" ").filter((t) => t.length > 1 || t === "aj");
}

function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  if (ta.length >= 2 && tb.length >= 2) {
    const flA = ta[0] + " " + ta[ta.length - 1];
    const flB = tb[0] + " " + tb[tb.length - 1];
    if (flA === flB) return true;
    // same last name + first name shares prefix (Gem / Gemivir)
    if (ta[ta.length - 1] === tb[tb.length - 1]) {
      if (ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0])) return true;
    }
  }
  // chart short names like Aly / Kara / Katie / Vakhtang
  if (ta.length === 1 && tb[0] === ta[0]) return true;
  if (tb.length === 1 && ta[0] === tb[0]) return true;
  return false;
}

const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
const active = rows.filter(
  (r) =>
    r["billing-active"] === "1" &&
    r.status !== "Bot" &&
    r.status !== "Deactivated" &&
    !String(r.email || "").includes("slack-bots.com")
);

const html = fs.readFileSync(htmlPath, "utf8");
const seedNames = [];
const re = /makePerson\(\s*"([^"]+)"/g;
let m;
while ((m = re.exec(html))) {
  if (m[1] !== "TBD" && m[1] !== "New Person") seedNames.push(m[1]);
}
const uniqueSeed = [...new Set(seedNames)];

const unmatched = [];
const matched = [];
const seenEmails = new Set();

for (const r of active) {
  const email = (r.email || "").toLowerCase().trim();
  if (email && seenEmails.has(email)) continue;
  if (email) seenEmails.add(email);

  const name = pickBestName(r);
  const hit = uniqueSeed.find(
    (s) =>
      namesMatch(s, name) ||
      namesMatch(s, stripNoise(r.fullname)) ||
      namesMatch(s, stripNoise(r.displayname))
  );
  if (hit) matched.push({ slack: name, chart: hit, email: r.email });
  else unmatched.push({ name, email: r.email, fullname: r.fullname, display: r.displayname, username: r.username });
}

unmatched.sort((a, b) => a.name.localeCompare(b.name));

function esc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const peopleLines = unmatched.map((u) => {
  const emailArg = u.email ? `"${esc(u.email)}"` : "null";
  return `        makePerson("${esc(u.name)}", "", null, "Imported from Slack — unallocated", false, null, ${emailArg}),`;
});

const snippet = `      const unallocatedPeople = [
${peopleLines.join("\n")}
      ];
      const unallocated = makeTeam("Unallocated", null, unallocatedPeople, [], null, "slate");
`;

fs.writeFileSync(outJson, JSON.stringify({ unmatched, matched, activeCount: active.length, seedCount: uniqueSeed.length }, null, 2));
fs.writeFileSync(outSnippet, snippet);

console.log("Active Slack humans (deduped email):", active.length);
console.log("Seed chart people:", uniqueSeed.length);
console.log("Matched:", matched.length);
console.log("Unallocated candidates:", unmatched.length);
console.log("Wrote", outJson);
console.log("Wrote", outSnippet);
