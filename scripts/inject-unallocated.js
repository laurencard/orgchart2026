/**
 * Injects Slack unallocated members into index.html:
 * 1) Adds Unallocated team to buildInitialData()
 * 2) Adds ensureUnallocatedFromSlack() + applies it on load (local + cloud)
 */
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "index.html");
const unmatched = JSON.parse(fs.readFileSync(path.join(__dirname, "slack-unallocated.json"), "utf8")).unmatched;

function cleanName(name, email) {
  let n = String(name || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*[-–—]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!n || n.split(/\s+/).length < 2) {
    const local = String(email || "").split("@")[0] || "";
    if (local.includes(".")) {
      const parts = local.split(".").filter((p) => p && !/^consultant/i.test(p));
      if (parts.length >= 2) {
        n = parts
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }
  return n;
}

const members = unmatched.map((u) => ({
  name: cleanName(u.name, u.email),
  email: u.email || null,
}));

const seen = new Set();
const deduped = [];
for (const m of members) {
  const key = (m.email || "").toLowerCase() || m.name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(m);
}
deduped.sort((a, b) => a.name.localeCompare(b.name));

const membersLiteral = JSON.stringify(deduped, null, 2);

let html = fs.readFileSync(htmlPath, "utf8");
const nl = html.includes("\r\n") ? "\r\n" : "\n";

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

if (html.includes("SLACK_UNALLOCATED_MEMBERS")) {
  console.log("Already injected; aborting to avoid duplicates.");
  process.exit(0);
}

const makeTeamNeedle = `const makeTeam = (name, head = null, people = [], subteams = [], logo = null, color = null) => ({${nl}      id: uid(), name, head, people, subteams, collapsed: false, logo, color,${nl}    });`;
if (!html.includes(makeTeamNeedle)) fail("makeTeam marker not found");

const helper = `${makeTeamNeedle}${nl}
    // Active Slack members not already placed on the org chart (from slack export).${nl}    const SLACK_UNALLOCATED_MEMBERS = ${membersLiteral.split("\n").join(nl)};${nl}
    function normalizePersonKey(name) {${nl}      return String(name || "")${nl}        .toLowerCase()${nl}        .normalize("NFD")${nl}        .replace(/[\\u0300-\\u036f]/g, "")${nl}        .replace(/[^a-z0-9\\s]/g, " ")${nl}        .replace(/\\s+/g, " ")${nl}        .trim();${nl}    }${nl}
    function personKeysMatch(a, b) {${nl}      const na = normalizePersonKey(a);${nl}      const nb = normalizePersonKey(b);${nl}      if (!na || !nb) return false;${nl}      if (na === nb) return true;${nl}      if (na.includes(nb) || nb.includes(na)) return true;${nl}      const ta = na.split(" ").filter(Boolean);${nl}      const tb = nb.split(" ").filter(Boolean);${nl}      if (ta.length >= 2 && tb.length >= 2) {${nl}        if (ta[0] + " " + ta[ta.length - 1] === tb[0] + " " + tb[tb.length - 1]) return true;${nl}        if (ta[ta.length - 1] === tb[tb.length - 1] && (ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0]))) return true;${nl}      }${nl}      if (ta.length === 1 && tb[0] === ta[0]) return true;${nl}      if (tb.length === 1 && ta[0] === tb[0]) return true;${nl}      return false;${nl}    }${nl}
    function ensureUnallocatedFromSlack(teams) {${nl}      if (!Array.isArray(teams)) return teams;${nl}      const clone = (list) => list.map(t => ({ ...t, people: [...(t.people || [])], subteams: clone(t.subteams || []) }));${nl}      let next = clone(teams);${nl}      const existing = flattenPeople(next);${nl}      const emails = new Set(existing.map(p => (p.email || "").toLowerCase()).filter(Boolean));${nl}      const names = existing.map(p => p.name);${nl}
      const isKnown = (m) => {${nl}        const em = (m.email || "").toLowerCase();${nl}        if (em && emails.has(em)) return true;${nl}        return names.some(n => personKeysMatch(n, m.name));${nl}      };${nl}
      const missing = SLACK_UNALLOCATED_MEMBERS.filter(m => !isKnown(m)).map(m =>${nl}        makePerson(m.name, "", null, "Imported from Slack — unallocated", false, null, m.email || null)${nl}      );${nl}
      const findUnallocated = (list) => {${nl}        for (const t of list) {${nl}          if (t.name === "Unallocated") return t;${nl}          const nested = findUnallocated(t.subteams || []);${nl}          if (nested) return nested;${nl}        }${nl}        return null;${nl}      };${nl}
      if (!findUnallocated(next)) {${nl}        next = [...next, makeTeam("Unallocated", null, [], [], null, "slate")];${nl}      }${nl}      if (missing.length === 0) return next;${nl}
      const attach = (list) => list.map(t => {${nl}        if (t.name === "Unallocated") {${nl}          return { ...t, people: [...(t.people || []), ...missing] };${nl}        }${nl}        return { ...t, subteams: attach(t.subteams || []) };${nl}      });${nl}      return attach(next);${nl}    }`;

html = html.replace(makeTeamNeedle, helper);

const seedNeedle = `const markDiv = makeTeam("Mark Schacknies — Co-Founder", makePerson("Mark Schacknies", "Co-Founder"), [], [compliance, salesMarketing]);${nl}      return [markDiv, jonathanDiv];`;
const seedRepl = `const markDiv = makeTeam("Mark Schacknies — Co-Founder", makePerson("Mark Schacknies", "Co-Founder"), [], [compliance, salesMarketing]);${nl}      const unallocated = makeTeam(${nl}        "Unallocated",${nl}        null,${nl}        SLACK_UNALLOCATED_MEMBERS.map(m => makePerson(m.name, "", null, "Imported from Slack — unallocated", false, null, m.email || null)),${nl}        [],${nl}        null,${nl}        "slate"${nl}      );${nl}      return [markDiv, jonathanDiv, unallocated];`;
if (!html.includes(seedNeedle)) fail("seed return marker not found");
html = html.replace(seedNeedle, seedRepl);

const loadNeedle = `function loadSavedData() {${nl}      try {${nl}        if (typeof localStorage === "undefined") return buildInitialData();${nl}        const raw = localStorage.getItem(STORAGE_KEY);${nl}        return raw ? JSON.parse(raw) : buildInitialData();${nl}      } catch {${nl}        return buildInitialData();${nl}      }${nl}    }`;
const loadRepl = `function loadSavedData() {${nl}      try {${nl}        if (typeof localStorage === "undefined") return ensureUnallocatedFromSlack(buildInitialData());${nl}        const raw = localStorage.getItem(STORAGE_KEY);${nl}        const base = raw ? JSON.parse(raw) : buildInitialData();${nl}        return ensureUnallocatedFromSlack(base);${nl}      } catch {${nl}        return ensureUnallocatedFromSlack(buildInitialData());${nl}      }${nl}    }`;
if (!html.includes(loadNeedle)) fail("loadSavedData marker not found");
html = html.replace(loadNeedle, loadRepl);

const cloudNeedle = `if (data && data.payload != null) {${nl}            setTeams(data.payload);${nl}            try {${nl}              if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(data.payload));${nl}            } catch { /* ignore */ }${nl}            setCloudState("ready");${nl}            return;${nl}          }`;
const cloudRepl = `if (data && data.payload != null) {${nl}            const merged = ensureUnallocatedFromSlack(data.payload);${nl}            setTeams(merged);${nl}            try {${nl}              if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));${nl}            } catch { /* ignore */ }${nl}            setCloudState("ready");${nl}            return;${nl}          }`;
if (!html.includes(cloudNeedle)) fail("cloud load marker not found");
html = html.replace(cloudNeedle, cloudRepl);

fs.writeFileSync(htmlPath, html);

const ok =
  html.includes("SLACK_UNALLOCATED_MEMBERS") &&
  html.includes("ensureUnallocatedFromSlack") &&
  html.includes("return [markDiv, jonathanDiv, unallocated]");
console.log("Injected", deduped.length, "unallocated Slack members into index.html");
console.log("Verification ok:", ok);
if (!ok) process.exit(1);
