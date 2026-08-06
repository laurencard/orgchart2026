/**
 * Re-crossref Slack CSV vs current org chart names, then inject
 * SLACK_UNALLOCATED_MEMBERS + merge helpers into index.html.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const csvPath = "C:/Users/lauren/Downloads/slack-nftydoor-members.csv";
const outJson = path.join(__dirname, "slack-unallocated.json");

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
  n = n.replace(/\s*[-–—]\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Training|CXM|PQ|Processing|Closing|Partner Care|NFTY).*$/i, "");
  n = n.replace(/\s+\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?\s*[-–]\s*\d{1,2}.*$/i, "");
  n = n.replace(/\s+\d{1,2}(-|–)\d{1,2}\s*(AM|PM|am|pm|PST|EST|CST|MST|ET|PT)?.*$/i, "");
  n = n.replace(/\s+\d{1,2}a-\d{1,2}p\b.*$/i, "");
  n = n.replace(/\s+(PST|EST|CST|MST|ET|PT|UTC)\b.*$/i, "");
  n = n.replace(/\s*[,/]\s*(Processing|Title|CXM|DTI|Closing|Insurance|Concierge|NFTY Support).*$/i, "");
  n = n.replace(/\s*[-–—]\s*$/, "");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

function pickBestName(r) {
  const full = stripNoise(r.fullname);
  const display = stripNoise(r.displayname);
  const candidates = [full, display].filter(Boolean);
  candidates.sort((a, b) => {
    const ta = a.split(/\s+/).length;
    const tb = b.split(/\s+/).length;
    if (tb !== ta) return tb - ta;
    return b.length - a.length;
  });
  let best = candidates[0] || stripNoise(r.username) || r.username;
  if (!best || best.split(/\s+/).length < 2) {
    const local = String(r.email || "").split("@")[0] || "";
    if (local.includes(".")) {
      const parts = local.split(".").filter((p) => p && !/^consultant/i.test(p));
      if (parts.length >= 2) {
        best = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
      }
    }
  }
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
  if (!ta.length || !tb.length) return false;
  if (ta.length >= 2 && tb.length >= 2) {
    if (ta[0] + " " + ta[ta.length - 1] === tb[0] + " " + tb[tb.length - 1]) return true;
    if (ta[ta.length - 1] === tb[tb.length - 1] && (ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0]))) return true;
  }
  if (ta.length === 1 && tb[0] === ta[0]) return true;
  if (tb.length === 1 && ta[0] === tb[0]) return true;
  return false;
}

function extractChartNames(html) {
  const names = new Set();
  const add = (n) => {
    const cleaned = stripNoise(n);
    if (cleaned && cleaned !== "TBD" && cleaned !== "New Person" && cleaned !== "New Team" && cleaned !== "New Division") {
      names.add(cleaned);
    }
  };
  for (const re of [/makePerson\(\s*"([^"]+)"/g, /\bp\(\s*"([^"]+)"/g]) {
    let m;
    while ((m = re.exec(html))) add(m[1]);
  }
  // quoted names in sheet person lists often appear as "First Last"
  // Already covered via makePerson/p in most cases.
  return [...names];
}

if (!fs.existsSync(csvPath)) {
  console.error("Slack CSV not found at", csvPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");
const nl = html.includes("\r\n") ? "\r\n" : "\n";
const chartNames = extractChartNames(html);

const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
const active = rows.filter(
  (r) =>
    r["billing-active"] === "1" &&
    r.status !== "Bot" &&
    r.status !== "Deactivated" &&
    !String(r.email || "").includes("slack-bots.com")
);

const unmatched = [];
const matched = [];
const seenEmails = new Set();

for (const r of active) {
  const email = (r.email || "").toLowerCase().trim();
  if (email && seenEmails.has(email)) continue;
  if (email) seenEmails.add(email);

  const name = pickBestName(r);
  const hit = chartNames.find(
    (s) =>
      namesMatch(s, name) ||
      namesMatch(s, stripNoise(r.fullname)) ||
      namesMatch(s, stripNoise(r.displayname))
  );
  if (hit) matched.push({ slack: name, chart: hit, email: r.email });
  else unmatched.push({ name, email: r.email || null });
}

unmatched.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(outJson, JSON.stringify({ unmatched, matched, activeCount: active.length, chartCount: chartNames.length }, null, 2));
console.log("Chart names:", chartNames.length);
console.log("Active Slack:", active.length);
console.log("Matched:", matched.length);
console.log("Unallocated to add:", unmatched.length);

if (html.includes("SLACK_UNALLOCATED_MEMBERS")) {
  console.error("SLACK_UNALLOCATED_MEMBERS already present — aborting to avoid duplicates.");
  process.exit(1);
}

const membersLiteral = JSON.stringify(unmatched, null, 2).split("\n").join(nl);

// 1) Insert constant + helpers after makeTeam
const makeTeamNeedle = `const makeTeam = (name, head = null, people = [], subteams = [], logo = null, color = null) => ({${nl}  id: uid(),${nl}  name,${nl}  head,${nl}  people,${nl}  subteams,${nl}  collapsed: false,${nl}  logo,${nl}  color${nl}});`;

if (!html.includes(makeTeamNeedle)) {
  console.error("makeTeam marker not found");
  process.exit(1);
}

const helpers = `${makeTeamNeedle}${nl}
// Active Slack members not already placed on the org chart (from slack export).${nl}const SLACK_UNALLOCATED_MEMBERS = ${membersLiteral};${nl}
function normalizePersonKey(name) {${nl}  return String(name || "")${nl}    .toLowerCase()${nl}    .normalize("NFD")${nl}    .replace(/[\\u0300-\\u036f]/g, "")${nl}    .replace(/[^a-z0-9\\s]/g, " ")${nl}    .replace(/\\s+/g, " ")${nl}    .trim();${nl}}${nl}
function personKeysMatch(a, b) {${nl}  const na = normalizePersonKey(a);${nl}  const nb = normalizePersonKey(b);${nl}  if (!na || !nb) return false;${nl}  if (na === nb) return true;${nl}  if (na.includes(nb) || nb.includes(na)) return true;${nl}  const ta = na.split(" ").filter(Boolean);${nl}  const tb = nb.split(" ").filter(Boolean);${nl}  if (ta.length >= 2 && tb.length >= 2) {${nl}    if (ta[0] + " " + ta[ta.length - 1] === tb[0] + " " + tb[tb.length - 1]) return true;${nl}    if (ta[ta.length - 1] === tb[tb.length - 1] && (ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0]))) return true;${nl}  }${nl}  if (ta.length === 1 && tb[0] === ta[0]) return true;${nl}  if (tb.length === 1 && ta[0] === tb[0]) return true;${nl}  return false;${nl}}${nl}
function ensureUnallocatedFromSlack(teams) {${nl}  if (!Array.isArray(teams)) return teams;${nl}  const clone = (list) => list.map(t => ({ ...t, people: [...(t.people || [])], subteams: clone(t.subteams || []) }));${nl}  let next = clone(teams);${nl}  const existing = flattenPeople(next);${nl}  const names = existing.map(p => p.name);${nl}  const isKnown = (m) => names.some(n => personKeysMatch(n, m.name));${nl}  const missing = SLACK_UNALLOCATED_MEMBERS.filter(m => !isKnown(m)).map(m =>${nl}    makePerson(m.name, "", null, false, null)${nl}  );${nl}  const findUnallocated = (list) => {${nl}    for (const t of list) {${nl}      if (t.name === "Unallocated") return t;${nl}      const nested = findUnallocated(t.subteams || []);${nl}      if (nested) return nested;${nl}    }${nl}    return null;${nl}  };${nl}  if (!findUnallocated(next)) {${nl}    next = [...next, makeTeam("Unallocated", null, [], [], null, "slate")];${nl}  }${nl}  if (missing.length === 0) return next;${nl}  const attach = (list) => list.map(t => {${nl}    if (t.name === "Unallocated") {${nl}      return { ...t, people: [...(t.people || []), ...missing] };${nl}    }${nl}    return { ...t, subteams: attach(t.subteams || []) };${nl}  });${nl}  return attach(next);${nl}}`;

let next = html.replace(makeTeamNeedle, helpers);

// 2) loadSavedData
const loadNeedle = `function loadSavedData() {${nl}  try {${nl}    if (typeof localStorage === "undefined") return buildInitialData();${nl}    const raw = localStorage.getItem(STORAGE_KEY);${nl}    return raw ? normalizeTeams(JSON.parse(raw)) : buildInitialData();${nl}  } catch {${nl}    return buildInitialData();${nl}  }${nl}}`;
const loadRepl = `function loadSavedData() {${nl}  try {${nl}    if (typeof localStorage === "undefined") return ensureUnallocatedFromSlack(buildInitialData());${nl}    const raw = localStorage.getItem(STORAGE_KEY);${nl}    const base = raw ? normalizeTeams(JSON.parse(raw)) : buildInitialData();${nl}    return ensureUnallocatedFromSlack(base);${nl}  } catch {${nl}    return ensureUnallocatedFromSlack(buildInitialData());${nl}  }${nl}}`;
if (!next.includes(loadNeedle)) {
  console.error("loadSavedData marker not found");
  process.exit(1);
}
next = next.replace(loadNeedle, loadRepl);

// 3) Seed: after roster-based unallocatedPeople, also merge Slack members
const seedNeedle = `  const unallocatedPeople = roster.filter(person => !isNamePlaced(person.name, placedNames) && !isPlacedPerson(person.name)).filter(person => {${nl}    const key = person.name.toLowerCase().trim();${nl}    if (seen.has(key)) return false;${nl}    seen.add(key);${nl}    return true;${nl}  }).map(person => makePerson(person.name, person.title || person.role || "", person.workingHours ?? null, person.isTBD, person.photoUrl ?? null));${nl}  const unallocated = makeTeam("Unallocated", null, unallocatedPeople, [], null, "slate");`;

const seedRepl = `  const unallocatedPeople = roster.filter(person => !isNamePlaced(person.name, placedNames) && !isPlacedPerson(person.name)).filter(person => {${nl}    const key = person.name.toLowerCase().trim();${nl}    if (seen.has(key)) return false;${nl}    seen.add(key);${nl}    return true;${nl}  }).map(person => makePerson(person.name, person.title || person.role || "", person.workingHours ?? null, person.isTBD, person.photoUrl ?? null));${nl}  SLACK_UNALLOCATED_MEMBERS.forEach(m => {${nl}    const key = m.name.toLowerCase().trim();${nl}    if (seen.has(key)) return;${nl}    if (isNamePlaced(m.name, placedNames) || isPlacedPerson(m.name)) return;${nl}    if (unallocatedPeople.some(p => personKeysMatch(p.name, m.name))) return;${nl}    seen.add(key);${nl}    unallocatedPeople.push(makePerson(m.name, "", null, false, null));${nl}  });${nl}  const unallocated = makeTeam("Unallocated", null, unallocatedPeople, [], null, "slate");`;

if (!next.includes(seedNeedle)) {
  console.error("seed unallocated marker not found");
  process.exit(1);
}
next = next.replace(seedNeedle, seedRepl);

// 4) Cloud load path
const cloudNeedle = `        if (data && data.payload != null) {${nl}          setTeams(normalizeTeams(data.payload));${nl}          try {${nl}            if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(data.payload));${nl}          } catch {}${nl}          setCloudState("ready");${nl}          return;${nl}        }`;
const cloudRepl = `        if (data && data.payload != null) {${nl}          const merged = ensureUnallocatedFromSlack(normalizeTeams(data.payload));${nl}          setTeams(merged);${nl}          try {${nl}            if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));${nl}          } catch {}${nl}          setCloudState("ready");${nl}          return;${nl}        }`;
if (!next.includes(cloudNeedle)) {
  console.error("cloud load marker not found");
  process.exit(1);
}
next = next.replace(cloudNeedle, cloudRepl);

fs.writeFileSync(htmlPath, next);

const ok =
  next.includes("SLACK_UNALLOCATED_MEMBERS") &&
  next.includes("ensureUnallocatedFromSlack") &&
  next.includes("SLACK_UNALLOCATED_MEMBERS.forEach");
console.log("Wrote index.html; verification ok:", ok);
if (!ok) process.exit(1);
