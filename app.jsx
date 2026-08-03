    const { useState, useEffect, useRef, useMemo } = React;

    const STORAGE_KEY = "nfty-org-chart-v7";
    const AUTH_KEY = "nfty-org-auth";
    const SITE_PASSWORD = "NFTYDoorPODs";
    const ORG_CHART_API = "/api/org-chart";

    async function fetchCloudState() {
      const res = await fetch(ORG_CHART_API, { cache: "no-store" });
      return res;
    }

    async function saveCloudState(payload) {
      const res = await fetch(ORG_CHART_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      return res;
    }

    // ── Inline Lucide-style icons (SVG) ──
    const svgProps = (size, className) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className: className || '' });
    const Search = ({ size = 24, className }) => <svg {...svgProps(size, className)}><circle cx="11" cy="11" r="8"/><path d="m21 21-6-6"/></svg>;
    const Plus = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M12 5v14M5 12h14"/></svg>;
    const Trash2 = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>;
    const ChevronDown = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="m6 9 6 6 6-6"/></svg>;
    const ChevronRight = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="m9 18 6-6-6-6"/></svg>;
    const Copy = ({ size = 24, className }) => <svg {...svgProps(size, className)}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
    const Download = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
    const Edit3 = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
    const Check = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M20 6 9 17l-5-5"/></svg>;
    const X = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
    const GripVertical = ({ size = 24, className }) => <svg {...svgProps(size, className)}><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>;
    const Users = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    const AlertCircle = ({ size = 24, className }) => <svg {...svgProps(size, className)}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
    const Eye = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    const EyeOff = ({ size = 24, className }) => <svg {...svgProps(size, className)}><path d="M10.73 5.08a10.07 10.07 0 0 1 11.27 11.27 1 1 0 0 1-.41 1.41"/><path d="M14 14a3 3 0 0 1-4.24-4.24"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M2 2l20 20"/></svg>;
    const Printer = ({ size = 24, className }) => <svg {...svgProps(size, className)}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></svg>;
    const Clock = ({ size = 24, className }) => <svg {...svgProps(size, className)}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    const Lock = ({ size = 24, className }) => <svg {...svgProps(size, className)}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    const Crown = ({ size = 24, className }) => {
      const p = svgProps(size, className);
      return <svg {...p} strokeWidth={size <= 16 ? 1.5 : 2}><path d="M2 17l4-9 4 5 2-8 2 8 4-5 4 9H2z"/></svg>;
    };

    const ACCENT_COLORS = [
      { bg: "bg-blue-600", light: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
      { bg: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
      { bg: "bg-violet-600", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
      { bg: "bg-amber-600", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
      { bg: "bg-rose-600", light: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
      { bg: "bg-cyan-600", light: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
      { bg: "bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
      { bg: "bg-pink-600", light: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
    ];

    const TEAM_COLORS = {
      yellow:  { bg: "bg-yellow-500", light: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" },
      purple:  { bg: "bg-purple-600", light: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
      green:   { bg: "bg-green-600", light: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
      pink:    { bg: "bg-pink-500", light: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
      blue:    { bg: "bg-blue-600", light: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
      red:     { bg: "bg-red-600", light: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
      cyan:    { bg: "bg-cyan-600", light: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
      orange:  { bg: "bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
      slate:   { bg: "bg-slate-600", light: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700" },
      violet:  { bg: "bg-violet-600", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
      emerald: { bg: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
      amber:   { bg: "bg-amber-600", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
      rose:    { bg: "bg-rose-600", light: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
      indigo:  { bg: "bg-indigo-600", light: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
      teal:    { bg: "bg-teal-600", light: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
    };

    let _id = 1000;
    function loadSavedData() {
      try {
        if (typeof localStorage === "undefined") return buildInitialData();
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? normalizeTeams(JSON.parse(raw)) : buildInitialData();
      } catch {
        return buildInitialData();
      }
    }
    const uid = () => `id_${_id++}`;

    function countPeople(team, includeTBD = true) {
      let c = (team.people || []).filter(p => includeTBD || !p.isTBD).length;
      if (team.head && (includeTBD || !team.head.isTBD)) c++;
      (team.subteams || []).forEach(st => { c += countPeople(st, includeTBD); });
      return c;
    }

    function flattenPeople(teams) {
      let result = [];
      teams.forEach(t => {
        if (t.head) result.push({ ...t.head, teamId: t.id });
        (t.people || []).forEach(p => result.push({ ...p, teamId: t.id }));
        if (t.subteams) result = result.concat(flattenPeople(t.subteams));
      });
      return result;
    }

    function collectOpenRoles(teams, hiringManager = null) {
      let roles = [];
      teams.forEach(t => {
        const mgr = t.head ? t.head.name : hiringManager;
        (t.people || []).forEach(p => {
          if (p.isTBD) roles.push({ title: p.title || p.role || "", team: t.name, hiringManager: mgr || "Unassigned" });
        });
        if (t.subteams) roles = roles.concat(collectOpenRoles(t.subteams, mgr));
      });
      return roles;
    }

    const makePerson = (name, title = "", workingHours = null, isTBD = false, photoUrl = null) => ({
      id: uid(), name, title, workingHours, isTBD, photoUrl,
    });

    function normalizePerson(p) {
      if (!p) return p;
      const { role, startDate, description, email, location, ...rest } = p;
      return { ...rest, title: rest.title ?? role ?? "", workingHours: rest.workingHours ?? null };
    }

    function normalizeTeams(list) {
      return list.map(t => ({
        ...t,
        head: t.head ? normalizePerson(t.head) : null,
        people: (t.people || []).map(normalizePerson),
        subteams: normalizeTeams(t.subteams || []),
      }));
    }
    const makeTeam = (name, head = null, people = [], subteams = [], logo = null, color = null) => ({
      id: uid(), name, head, people, subteams, collapsed: false, logo, color,
    });

    function NFTYDoorLogo({ size = 40 }) {
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="14" fill="#3B3F45" />
          <path d="M50 16C33.4 16 20 29.4 20 46V84H34V46C34 37.2 41.2 30 50 30C58.8 30 66 37.2 66 46V84H80V46C80 29.4 66.6 16 50 16Z" fill="white" />
          <rect x="42" y="54" width="16" height="30" rx="3" fill="#2196F3" />
        </svg>
      );
    }

    function CrombieLogo({ size = 36 }) {
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="3" width="18" height="4" rx="2" fill="#00BCD4" />
          <rect x="2" y="9" width="22" height="4" rx="2" fill="#FF9800" />
          <rect x="26" y="9" width="6" height="4" rx="2" fill="#00BCD4" />
          <rect x="2" y="15" width="20" height="4" rx="2" fill="#E91E63" />
          <circle cx="27" cy="17" r="2.5" fill="#4CAF50" />
          <rect x="2" y="21" width="14" height="4" rx="2" fill="#4CAF50" />
          <rect x="18" y="21" width="10" height="4" rx="2" fill="#E91E63" />
          <rect x="2" y="27" width="24" height="4" rx="2" fill="#9C27B0" />
        </svg>
      );
    }

    function getInitials(name) {
      if (!name || name === "TBD") return "?";
      return name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    }

    function Avatar({ person, size = 36, accent }) {
      return person.photoUrl ? (
        <img src={person.photoUrl} alt={person.name} className="rounded-full object-cover border-2 border-white shadow-sm" style={{ width: size, height: size }} />
      ) : (
        <div className={`rounded-full ${accent.bg} text-white flex items-center justify-center font-semibold shadow-sm border-2 border-white`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
          {getInitials(person.name)}
        </div>
      );
    }

    function buildLegacyTeams() {
      const micheleDaniel = makeTeam("Daniel Bell", makePerson("Daniel Bell", "CXM"), [makePerson("Juan Camilo Roa Munoz", "CXA")]);
      const micheleCallie = makeTeam("Callie Partain", makePerson("Callie Partain", "CXM"), [makePerson("Andy Hernandez", "CXA")]);
      const micheleJessica = makeTeam("Jessica Grayson", makePerson("Jessica Grayson", "CXM"), [makePerson("Lina Fajardo", "CXA")]);
      const micheleRebecca = makeTeam("Rebecca Slawter", makePerson("Rebecca Slawter", "CXM"), [makePerson("Isabella Yidi", "CXA")]);
      const micheleAly = makeTeam("Aly", makePerson("Aly", "CXM"), [makePerson("Shen Villavicencio", "CXA")]);
      const cxMicheleTeam = makeTeam("CXM Team — Michele Farina", makePerson("Michele Farina", "CXM Team Lead"), [makePerson("Joferson Salo", "CX Assistant")], [micheleDaniel, micheleCallie, micheleJessica, micheleRebecca, micheleAly]);

      const isidraLuis = makeTeam("Luis Miranda", makePerson("Luis Miranda", "CXM"), [makePerson("Joseph Araque", "CXA")]);
      const isidraShanae = makeTeam("Shanae Mckenzie", makePerson("Shanae Mckenzie", "CXM"), [makePerson("Laura Mancipe Robles", "CXA")]);
      const isidraBriana = makeTeam("Briana Stockett", makePerson("Briana Stockett", "CXM"), [makePerson("Alejandra Garcia", "CXA")]);
      const isidraTami = makeTeam("Tami Matthews", makePerson("Tami Matthews", "CXM"), [makePerson("Isabel Carvajales", "CXA")]);
      const isidraKara = makeTeam("Kara", makePerson("Kara", "CXM"), [makePerson("Sheena Ello", "CXA")]);
      const cxIsidraTeam = makeTeam("CXM Team — Isidra Almaraz", makePerson("Isidra Almaraz", "CXM Team Lead"), [makePerson("Stephany Perez", "CX Assistant")], [isidraLuis, isidraShanae, isidraBriana, isidraTami, isidraKara]);
      const cxTBDTeam = makeTeam("TBD — New CXM", makePerson("TBD", "CXM", null, true), [makePerson("Mailyn Stor", "CXA")]);
      const cx = makeTeam("CX", makePerson("Hayle Kluesner", "CX Dept Head"), [makePerson("Sharymynne Frilles", "CX - Closing Specialist")], [cxMicheleTeam, cxIsidraTeam, cxTBDTeam]);

      const concierge = makeTeam("Concierge", makePerson("Kate Hutchinson", "Head of Concierge"), [
        makePerson("Ashley Fischer", "Product Trainer"),
        makePerson("Princess Lagman", "HD TL"),
        makePerson("Kim Angeli Cristobal", "STM"),
        makePerson("AJ Pecson", "Concierge"),
        makePerson("Jude Maureen Dowa", "Concierge"),
        makePerson("Jeffrey Fernandez Canlas", "Concierge"),
        makePerson("Vladimir Daanoy", "Concierge"),
        makePerson("Jan Santiago", "Concierge"),
        makePerson("Marilou Tumambo", "Concierge"),
        makePerson("Reniel Palaganas", "Concierge"),
        makePerson("Gemivir De Vera", "Concierge"),
        makePerson("Angelique Israel", "Concierge"),
      ]);

      const pq = makeTeam("PQ", makePerson("Kara Schlitt", "PQ Team Lead"), [
        makePerson("Cadiah Arceo", "PQ Analyst"), makePerson("Jimmark Avillon", "PQ Analyst"), makePerson("Henry Del Rosario", "PQ Analyst"),
        makePerson("Julieta Navarro", "PQ Analyst"), makePerson("Leonelyn Valentin", "PQ Analyst"), makePerson("Juan Francisco Marticorena", "PQ Analyst"),
        makePerson("Sol Alderete", "PQ Analyst"), makePerson("Frank Angeles", "PQ Analyst"), makePerson("Katherine Marabulas", "PQ Analyst"),
        makePerson("Jonamie Gumayagay", "PQ Analyst"), makePerson("Nelson Francisco", "PQ Analyst"),
      ], [], null, "green");

      const dtiTeamA = makeTeam("Team A", null, [makePerson("Vijay Shanbhag", "DTI Analyst"), makePerson("Rodee Cabalida", "DTI Analyst"), makePerson("Enrique Ramirez", "DTI Analyst")]);
      const dtiTeamB = makeTeam("Team B", null, [makePerson("Quinne Baxal", "DTI Analyst"), makePerson("Patima Pina Dungo", "DTI Analyst"), makePerson("Gean Carlo Piza", "DTI Analyst")]);
      const dtiTeamC = makeTeam("Team C", null, [makePerson("Cristine Joy Zerna", "DTI Analyst"), makePerson("Anna Karen Golpeo", "DTI Analyst"), makePerson("Sebastian D. Barinas", "DTI Analyst")]);
      const dtiTeamD = makeTeam("Team D", null, [makePerson("Rohit Jha", "DTI Analyst"), makePerson("Maria Manrique", "DTI Analyst"), makePerson("Ana Plaza", "DTI Analyst")]);
      const dti = makeTeam("DTI", makePerson("Shanice Robinson Ellis", "Head of DTI"), [
        makePerson("Berlito Derecho", "Shift Leader"), makePerson("LJ Basilio", "Shift Leader"), makePerson("Ishan Patnaik", "M2 Team Lead"),
      ], [dtiTeamA, dtiTeamB, dtiTeamC, dtiTeamD], null, "purple");

      const title = makeTeam("Title", makePerson("Rylee Crawford", "Head of Title"), [
        makePerson("Katie", "Title Analyst"), makePerson("Ruth Abiegail Lalic", "Team Lead"), makePerson("Kaze De Jesus", "Sr. Title Analyst"),
        makePerson("Joshua Singian", "Sr. Title Analyst"), makePerson("Jonah Rose Surla", "Title Analyst"), makePerson("Jenny Baluyut", "Title Analyst"),
        makePerson("Kris Maniaul", "Title Analyst"), makePerson("Santiago Maldonado", "Title Analyst"), makePerson("Ivan Hugh Manalili", "Title Analyst"),
        makePerson("Alex B. Pilapil Jr.", "Title Analyst"), makePerson("Shamille Veronica Arcilla", "Title Analyst"), makePerson("Duvan Villarreal", "Title Analyst"),
        makePerson("Anne Cristel Larin Corpuz", "Title Analyst"), makePerson("Alyca Rondina", "Title Analyst"),
      ], [], null, "yellow");

      const postClosing = makeTeam("Post Closing", makePerson("Brieauna Williams", "Head of Post Closing"), [
        makePerson("Kei Masuzawa", "Post Closing Analyst"), makePerson("Constanza Rotela", "Post Closing Analyst"),
        makePerson("Nicolas Rois", "Post Closing Analyst"), makePerson("Sarah Jane Jumawan", "Post Closing Analyst"), makePerson("Silvia Huerta", "Post Closing Analyst"),
      ], [], null, "pink");

      const operations = makeTeam("Operations", makePerson("Linda Christensen", "Head of Ops"), [], [pq, cx, dti, title, postClosing]);

      const product = makeTeam("Product", makePerson("David Talbird", "Head of Product"), [
        makePerson("Lauren Card", "ProdOps"), makePerson("Ryan Morrison", "AI Strategist"), makePerson("Vakhtang", "Engineer"),
        makePerson("TBD", "Product Engineer", null, true), makePerson("TBD", "Product Engineer", null, true), makePerson("TBD", "Product Engineer", null, true),
      ]);
      const crombie = makeTeam("Crombie (External Partner)", null, [
        makePerson("Guillermo Plank", "Project Manager"), makePerson("Paula De Grazia", "Project Manager"),
        makePerson("Francisco Cajal", "Technical Project Leader"), makePerson("Leonardo Gilli", "Technical Project Leader"),
      ], [], "crombie");
      product.subteams = [crombie];

      const jonathanDiv = makeTeam("Jonathan Spinetto — Co-Founder", makePerson("Jonathan Spinetto", "Co-Founder"), [], [product, operations]);

      const compliance = makeTeam("Compliance", makePerson("Dom Savino", "EVP, Financial Products"), [
        makePerson("Julie Treloar", "Director of Risk & Compliance"), makePerson("TBD", "Treasury Analyst", null, true),
      ]);

      const salesMarketing = makeTeam("Sales & Marketing", makePerson("Leo Loomie", "Chief Revenue Officer"), [
        makePerson("Seth Cohen", "Sales"), makePerson("Stephanie Bunting", "Marketing"),
        makePerson("TBD", "Onboarding", null, true), makePerson("TBD", "Onboarding", null, true),
      ], [concierge]);

      const markDiv = makeTeam("Mark Schacknies — Co-Founder", makePerson("Mark Schacknies", "Co-Founder"), [], [compliance, salesMarketing]);
      return [markDiv, jonathanDiv];
    }

    // People placed on the management tree (heads + named direct reports) stay out of Unallocated.
    const PLACED_PATTERNS = [
      /^mark(\s+schacknies)?$/i,
      /^(leson\s+)?lee$/i,
      /^jonathan(\s+spinetto)?$/i,
      /^dom(\s+savino)?$/i,
      /^matt$/i,
      /^drew(\s+santorella(-doyle)?)?$/i,
      /^erica(\s+sands)?$/i,
      /^shubi(\s+\w+)?$/i,
      /^nicole(\s+\w+)?$/i,
      /^obi(\s+\w+)?$/i,
      /^leo(\s+loomie)?$/i,
      /^stephanie(\s+bunting)?$/i,
      /^seth(\s+cohen)?$/i,
      /^stacie(\s+cappadonna)?$/i,
      /^tim(\s+rowe)?$/i,
      /^linda(\s+christensen)?$/i,
      /^christina(\s+\w+)?$/i,
      /^brandi(\s+\w+)?$/i,
      /^ebony(\s+\w+)?$/i,
      /^becky(\s+\w+)?$/i,
      /^ruthie(\s+\w+)?$/i,
      /^lane(\s+\w+)?$/i,
      /^ashley(\s+fischer)?$/i,
      /^hayle(\s+kluesner)?$/i,
      /^jana(\s+\w+)?$/i,
      /^isidra(\s+almaraz)?$/i,
      /^lauren(\s+card)?$/i,
      /^kara\s+schlitt$/i,
      /^shanice(\s+robinson(\s+ellis)?)?$/i,
      /^rylee(\s+crawford)?$/i,
      /^brie(auna)?(\s+williams)?$/i,
      /^jared(\s+b\w*)?$/i,
    ];

    function isPlacedPerson(name) {
      if (!name || name === "TBD") return false;
      const n = name.trim();
      return PLACED_PATTERNS.some(re => re.test(n));
    }

    function findInRoster(roster, ...keys) {
      const lowerKeys = keys.map(k => k.toLowerCase());
      return roster.find(p => {
        const n = p.name.toLowerCase().trim();
        return lowerKeys.some(k => n === k || n.startsWith(k + " "));
      }) || null;
    }

    function fromRoster(roster, displayName, title, ...extraKeys) {
      const keys = [displayName, displayName.split(" ")[0], ...extraKeys].map(k => k.toLowerCase());
      const found = findInRoster(roster, ...keys);
      const isTBD = displayName === "TBD" || /\bTBD\b/i.test(title);
      return makePerson(found?.name || displayName, title, found?.workingHours ?? null, isTBD, found?.photoUrl ?? null);
    }

    function buildInitialData() {
      const legacy = buildLegacyTeams();
      const roster = flattenPeople(legacy);
      const p = (name, title, ...keys) => fromRoster(roster, name, title, ...keys);

      // CEO direct reports: COO + Chief of Staff
      const capitalMarkets = makeTeam(
        "Capital Markets",
        p("Dom Savino", "EVP, Financial Products", "dom"),
        [p("Drew Santorella-Doyle", "Capital Markets", "drew", "santorella")],
        [],
        null,
        "amber"
      );

      const advisor = makeTeam("Strategic Advisor", p("Matt", "Strategic Advisor"), [], [], null, "slate");

      const jonathanBranch = makeTeam("COO", p("Jonathan Spinetto", "COO, Co-Founder"), [], [
        makeTeam("Engineering", p("Shubi", "Head of Engineering"), [], [
          makeTeam("Product", p("Erica Sands", "Head of Product", "erica"), [], [], null, "cyan"),
        ], null, "indigo"),
        makeTeam("Finance", p("Nicole", "Head of Finance"), [], [], null, "emerald"),
        makeTeam("Risk", p("Obi", "Head of Risk"), [], [], null, "rose"),
        capitalMarkets,
        advisor,
      ], null, "violet");

      const sales = makeTeam(
        "Sales",
        p("Leo Loomie", "Chief Revenue Officer", "leo"),
        [
          p("Stephanie Bunting", "Sales Marketing", "stephanie"),
          p("Seth Cohen", "Business Development", "seth"),
          p("Stacie Cappadonna", "Business Development", "stacie"),
        ],
        [],
        null,
        "blue"
      );

      const salesSuccess = makeTeam("Sales Success", p("Tim Rowe", "SVP, Sales Success", "tim"), [], [], null, "cyan");

      const clientSuccess = makeTeam(
        "Client Success",
        p("Linda Christensen", "Client Success", "linda"),
        [
          p("Christina", "Client Success"),
          p("Brandi", "Client Success"),
          p("Ebony", "Onboarding"),
          p("Becky", "Onboarding"),
          p("Ruthie", "Onboarding"),
          p("Alex", "Client Success Marketing"),
          p("Lane", "Training & Education"),
          p("Ashley Fischer", "Training & Education", "ashley"),
        ],
        [],
        null,
        "green"
      );

      const pods = buildPodsUnderHayle(roster, p);

      const opsExcellence = makeTeam("Operational Excellence", p("Jana", "Operational Excellence"), [], [
        pods,
        makeTeam("Training", p("Isidra Almaraz", "Training", "isidra"), [], [], null, "teal"),
        makeTeam("Service Desk", p("Lauren Card", "Service Desk", "lauren"), [], [], null, "slate"),
        makeTeam("PQ", p("Kara Schlitt", "PQ", "kara schlitt", "kara"), [], [], null, "amber"),
        makeTeam("DTI", p("Shanice Robinson Ellis", "DTI", "shanice"), [], [], null, "rose"),
        makeTeam("Title", p("Rylee Crawford", "Title", "rylee"), [], [], null, "violet"),
        makeTeam("Closing", makePerson("TBD", "Head of Closing", null, true), [], [], null, "pink"),
        makeTeam("Post Closing", p("Brieauna Williams", "Post Closing", "brieauna", "brie"), [], [], null, "indigo"),
        makeTeam("Servicing", p("Jared B", "Servicing", "jared"), [], [], null, "emerald"),
      ], null, "purple");

      const leeBranch = makeTeam("Chief of Staff", p("Lee", "Chief of Staff", "leson"), [], [
        sales,
        salesSuccess,
        clientSuccess,
        opsExcellence,
      ], null, "blue");

      const management = makeTeam(
        "NFTY",
        p("Mark Schacknies", "CEO, Co-Founder", "mark"),
        [],
        [jonathanBranch, leeBranch],
        null,
        "blue"
      );

      const placedNames = collectPersonNames([management]);
      const seen = new Set();
      const unallocatedPeople = roster
        .filter(person => !isNamePlaced(person.name, placedNames) && !isPlacedPerson(person.name))
        .filter(person => {
          const key = person.name.toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(person => makePerson(person.name, person.title || person.role || "", person.workingHours ?? null, person.isTBD, person.photoUrl ?? null));

      const unallocated = makeTeam("Unallocated", null, unallocatedPeople, [], null, "slate");

      return [management, unallocated];
    }

    function cleanSheetName(raw) {
      if (!raw) return null;
      const cleaned = String(raw)
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s*-\s*PC Lead/i, "")
        .replace(/\s+/g, " ")
        .trim();
      return cleaned || null;
    }

    function sheetPerson(roster, p, raw, defaultTitle) {
      const name = cleanSheetName(raw);
      if (!name) return null;
      let title = defaultTitle;
      if (/PC Lead/i.test(raw || "")) title = "Partner Care Lead";
      else if (/\(cnxt\)/i.test(raw || "")) title = `${defaultTitle} (Connext)`;
      else if (/email\/chat/i.test(raw || "")) title = `${defaultTitle} (Email/Chat)`;
      else if (/Moder/i.test(raw || "")) title = `${defaultTitle} (Moderator)`;
      return p(name, title, name.split(/\s+/)[0].toLowerCase());
    }

    function peopleFrom(roster, p, names, title) {
      return (names || []).map(n => sheetPerson(roster, p, n, title)).filter(Boolean);
    }

    function collectPersonNames(teams, into = new Set()) {
      (teams || []).forEach(t => {
        if (t.head?.name) into.add(t.head.name.toLowerCase().trim());
        (t.people || []).forEach(person => {
          if (person?.name) into.add(person.name.toLowerCase().trim());
        });
        collectPersonNames(t.subteams || [], into);
      });
      return into;
    }

    function isNamePlaced(name, placedNames) {
      if (!name) return false;
      const n = name.toLowerCase().trim();
      if (placedNames.has(n)) return true;
      for (const placed of placedNames) {
        if (n === placed || n.startsWith(placed + " ") || placed.startsWith(n + " ")) return true;
        const nParts = n.split(/\s+/);
        const pParts = placed.split(/\s+/);
        if (nParts[0] === pParts[0] && nParts[nParts.length - 1] === pParts[pParts.length - 1]) return true;
      }
      return false;
    }

    // Source: POD 2.0 sheet — https://docs.google.com/spreadsheets/d/1kbH6rHjjgjG9mF5NONsRXUdrlah3zFdY1AOOgIYkDTM
    function buildPodsUnderHayle(roster, p) {
      const colors = ["orange", "amber", "rose", "pink", "violet", "indigo", "blue", "cyan", "teal", "emerald", "green", "slate"];
      const podDefs = [
        {
          num: 1, lender: "West Cap", leader: "Lauren Moffo", color: colors[0],
          aes: ["Victoria DeLuce"],
          cxms: ["Francesca Venezia", "Kenney Jean-Gilles", "Niall Cummins", "Steve Wynne", "Denise Cortez", "Stacy Phillips", "Kristina Wilson", "Jessica Pascale", "Jade Wheel", "Joseph Araque (cnxt)", "Karina Rodriguez"],
          support: ["Denise Moul - PC Lead", "Sha Payton-Thompson", "Franchezka Tugonon (Moder)", "Ronnie Seroyla (Moder)", "Levie Siega (Moder)", "Elizer Martinez (Moder)", "Jefferson Draper (Moder)", "Rojohn Mobe (Moder)", "Shiela Jaim (Moder)", "Jeniffer Grande (Moder)", "Claudine Encio (Moder)", "Milken Alcover (Moder)", "Marimel Gubalane Fuentes (Moder)", "Darlin Erica Arias Yongco (Moder)"],
          pq: ["Ma. Lousiah Cadiah Arceo", "Divina Bagayao", "Luisa Fernanda Saavedra Piraneque", "Camilo santos Rodriguez", "Arianne Marie Fontanilla", "Angelica Mae Pascual"],
        },
        {
          num: 2, lender: "Truss", leader: "Aaron Walton", color: colors[1],
          aes: ["Victoria DeLuce"],
          cxms: ["Megan Gray", "Kaela Cho", "Laura Molina"],
          support: ["Joyce Brode", "Emmett Collins"],
          pq: ["Nelson Francisco", "Juan Sebastian Pedroza", "Catalina Leon"],
        },
        {
          num: 3, lender: "CMG", leader: "Amy DeFruscio", color: colors[2],
          aes: ["Victoria DeLuce"],
          cxms: ["Mandy Brandon", "Callie Partain", "Daniel Caminksy"],
          support: ["Aly Hunt", "Juan Diego Kahez (email/chat)"],
          pq: ["Francis Angeles", "Mailyn Vanessa Stor"],
        },
        {
          num: 4, lender: "CCM", leader: "Kara Salinas", color: colors[3],
          aes: ["Seth Cohen"],
          cxms: ["Briana Stockett", "Alejandra Torres (cnxt)"],
          support: ["Laura Elasivich", "Shelton Colter", "Zaldie Tulop"],
          pq: ["Katherine Marabulas", "Charis De Guzman"],
        },
        {
          num: 5, lender: "Nexa", leader: "Tiffany Wirfs", color: colors[4],
          aes: ["Seth Cohen"],
          cxms: ["Karen Jones", "Stephany Perez (cnxt)"],
          support: ["Kate Hutchinson", "Elda Marie Arupo"],
          pq: ["Jonamie Gumayagay", "Desiree Macutay", "Elizabeth Williams"],
        },
        {
          num: 6, lender: "PL Nest", leader: "Rebecca Slawter", color: colors[5],
          aes: ["Matt Wildman", "Derek Cioffi", "Jared Gordon", "James Brower", "Alex Aiello", "Nick Chene", "Chase Pfeffer"],
          cxms: ["Vu Nguyen", "Priscilla Feliciano"],
          support: ["Isabel Carvajales", "Kendall Sparrow", "Cielo Delabajan", "Christine Aragon (chat/email)"],
          pq: ["Juan Marticorena", "Ran Tiglao"],
        },
        {
          num: 7, lender: "Broker Core", leader: "Jessica Grayson", color: colors[6],
          aes: ["Matt Wildman", "Derek Cioffi", "Jared Gordon", "James Brower", "Alex Aiello", "Nick Chene", "Stacie Cappadonna", "Chase Pfeffer", "Victoria Deluce (CMG JVs, CapitalM)"],
          cxms: ["Heather Atkins", "Mikalyn Robinson", "Luis Miranda (cnxt)", "Brena Heiser", "Heena Patel", "Denise Renteria", "Jake Allen", "Jade Gilbert", "Valerie Medina", "Rachel Reber", "Krystal Collar", "Lissette Fernandez", "Hali Snyder", "Shanae McKenzie", "Shenylee Villavencio (cnxt)"],
          support: ["Jan Michael Santiago - PC Lead", "Batesh Mahmud", "Jeannie Beier", "Nevaeh Chavez", "AJ Pecson", "Gemivir De Vera (email/chat)", "Marilou Tumambo (email/chat)", "Jastin Tupas (email/chat)", "Angelique Israel (email/chat)", "Angelica Joy Reyes (email/chat)", "Reniel Palaganas (email/chat)", "Jeffrey Canlas (email/chat)", "Vladimir Daanoy (email/chat)", "Ma. Christine Flores (email/chat)", "Gina Mae Tenerife (email/chat)", "Juan Camilo Roa (email/chat)", "Laura Mancipe Robles (email/chat)"],
          pq: ["Ruth Abiegail Lalic", "Jimmark Avillon", "Lina Fajardo", "Jose Alejandro Castro Acuna", "Daniel Alejandro Lopez Urbina", "Jonathan Enrique Quiroz Jiménez", "Laura Nathaly Mendez Onrisa"],
        },
        { num: 8, lender: "Loan Depot", note: "9/3", leader: null, color: colors[7], aes: [], cxms: [], support: [], pq: [], tbd: true },
        { num: 9, lender: "Plaza", note: "Sept", leader: null, color: colors[8], aes: [], cxms: [], support: [], pq: [], tbd: true },
        { num: 10, lender: "theLender", note: "Sept", leader: null, color: colors[9], aes: [], cxms: [], support: [], pq: [], tbd: true },
        { num: 11, lender: "Mutual of Omaha", note: "Sept", leader: null, color: colors[10], aes: [], cxms: [], support: [], pq: [], tbd: true },
        { num: 12, lender: "OCMBC", note: "TBD", leader: null, color: colors[11], aes: [], cxms: [], support: [], pq: [], tbd: true },
      ];

      const podTeams = podDefs.map(def => {
        const label = def.note ? `POD ${def.num} — ${def.lender} (${def.note})` : `POD ${def.num} — ${def.lender}`;
        const head = def.leader
          ? p(def.leader, "Pod Leader", def.leader.split(/\s+/)[0].toLowerCase())
          : makePerson("TBD", "Pod Leader", null, true);
        const subteams = [];
        const cxms = peopleFrom(roster, p, def.cxms, "CXM");
        if (cxms.length) subteams.push(makeTeam("CXMs", null, cxms, [], null, def.color));
        const support = peopleFrom(roster, p, def.support, "Partner Care");
        if (support.length) subteams.push(makeTeam("Partner Care", null, support, [], null, def.color));
        const pq = peopleFrom(roster, p, def.pq, "PQ / Processing");
        if (pq.length) subteams.push(makeTeam("PQ / Processing", null, pq, [], null, def.color));
        const aes = peopleFrom(roster, p, def.aes, "Account Executive");
        return makeTeam(label, head, aes, subteams, null, def.color);
      });

      return makeTeam("PODs", p("Hayle Kluesner", "PODs Manager", "hayle"), [], podTeams, null, "orange");
    }

    const updateTeamR = (list, id, upd) => list.map(t => t.id === id ? { ...t, ...upd } : { ...t, subteams: updateTeamR(t.subteams || [], id, upd) });
    const deleteTeamR = (list, id) => list.filter(t => t.id !== id).map(t => ({ ...t, subteams: deleteTeamR(t.subteams || [], id) }));
    const addPersonR = (list, id) => list.map(t => t.id === id ? { ...t, people: [...(t.people || []), makePerson("New Person")] } : { ...t, subteams: addPersonR(t.subteams || [], id) });
    const addSubteamR = (list, id) => list.map(t => t.id === id ? { ...t, subteams: [...(t.subteams || []), makeTeam("New Team")] } : { ...t, subteams: addSubteamR(t.subteams || [], id) });
    const updatePersonR = (list, tid, up) => list.map(t => t.id === tid ? { ...t, people: (t.people || []).map(p => p.id === up.id ? up : p) } : { ...t, subteams: updatePersonR(t.subteams || [], tid, up) });
    const deletePersonR = (list, tid, pid) => list.map(t => t.id === tid ? { ...t, people: (t.people || []).filter(p => p.id !== pid) } : { ...t, subteams: deletePersonR(t.subteams || [], tid, pid) });
    const toggleCollapseR = (list, id) => list.map(t => t.id === id ? { ...t, collapsed: !t.collapsed } : { ...t, subteams: toggleCollapseR(t.subteams || [], id) });
    const expandAllR = (list) => list.map(t => ({ ...t, collapsed: false, subteams: expandAllR(t.subteams || []) }));

    function excisePerson(list, personId) {
      let found = null;
      const strip = (teams) => teams.map(t => {
        let next = { ...t };
        if (t.head?.id === personId) { found = t.head; next.head = null; }
        next.people = (t.people || []).filter(p => { if (p.id === personId) { found = p; return false; } return true; });
        next.subteams = strip(t.subteams || []);
        return next;
      });
      return [strip(list), found];
    }

    function injectPersonPeople(list, teamId, person) {
      return list.map(t => t.id === teamId ? { ...t, people: [...(t.people || []), person] } : { ...t, subteams: injectPersonPeople(t.subteams || [], teamId, person) });
    }
    function injectPersonHead(list, teamId, person) {
      return list.map(t => t.id === teamId ? { ...t, head: person } : { ...t, subteams: injectPersonHead(t.subteams || [], teamId, person) });
    }

    function PersonCard({ person, accent, onUpdate, onDelete, isSearchMatch }) {
      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(() => normalizePerson({ ...person }));
      const isTBD = person.isTBD;
      const title = person.title || person.role || "";

      const save = () => { onUpdate(normalizePerson({ ...draft })); setEditing(false); };
      const cancel = () => { setDraft(normalizePerson({ ...person })); setEditing(false); };

      if (editing) {
        return (
          <div className={`bg-white rounded-lg shadow-md border-2 ${accent.border} p-4 w-64 space-y-2`} onClick={e => e.stopPropagation()}>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Title" value={draft.title || ""} onChange={e => setDraft({ ...draft, title: e.target.value })} />
            <div className={`w-full border-2 border-dashed rounded px-2 py-3 text-center text-xs cursor-pointer transition ${draft.photoUrl ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) { const r = new FileReader(); r.onload = ev => setDraft(d => ({ ...d, photoUrl: ev.target.result })); r.readAsDataURL(f); } }}
              onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setDraft(d => ({ ...d, photoUrl: ev.target.result })); r.readAsDataURL(f); } }; i.click(); }}>
              {draft.photoUrl ? <div className="flex items-center justify-center gap-2"><img src={draft.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" /><span className="text-green-700">Photo added</span><button onClick={e => { e.stopPropagation(); setDraft(d => ({ ...d, photoUrl: null })); }} className="p-0.5 rounded hover:bg-red-100"><X size={12} className="text-red-400" /></button></div> : <span className="text-gray-400">Drop photo or click to browse</span>}
            </div>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Working hours (e.g. Mon–Fri 9am–5pm)" value={draft.workingHours || ""} onChange={e => setDraft({ ...draft, workingHours: e.target.value || null })} />
            <div className="flex gap-2 justify-end">
              <button onClick={cancel} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
              <button onClick={save} className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"><Check size={16} /></button>
            </div>
          </div>
        );
      }

      return (
        <div
          draggable
          onDragStart={e => { e.dataTransfer.setData("personId", person.id); e.dataTransfer.effectAllowed = "move"; }}
          className={`group relative bg-white rounded-lg shadow-sm border ${isTBD ? "border-dashed border-gray-400 opacity-75" : accent.border} p-3 w-64 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${isSearchMatch ? "ring-2 ring-yellow-400" : ""}`}
          onClick={() => setEditing(true)}
        >
          {isTBD && <div className="absolute top-1 right-1"><AlertCircle size={14} className="text-gray-400" /></div>}
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 mt-0.5"><Avatar person={person} size={34} accent={accent} /></div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isTBD ? "text-gray-400 italic" : "text-gray-800"}`}>{person.name}</p>
              {title && <p className={`text-xs truncate ${isTBD ? "text-gray-400" : "text-gray-500"}`}>{title}</p>}
              {person.workingHours && (
                <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5"><Clock size={10} className="shrink-0" />{person.workingHours}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); setEditing(true); }} className="p-0.5 rounded hover:bg-gray-100"><Edit3 size={12} className="text-gray-400" /></button>
              <button onClick={e => { e.stopPropagation(); if (confirm("Delete " + person.name + "?")) onDelete(person.id); }} className="p-0.5 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
              <GripVertical size={12} className="text-gray-300" />
            </div>
          </div>
        </div>
      );
    }

    function TeamNode({ team, accent: parentAccent, depth, searchIds, showOpenRoles, onUpdateTeam, onDeleteTeam, onAddPerson, onAddSubteam, onUpdatePerson, onDeletePerson, onMovePerson, onMakeHead, onToggleCollapse }) {
      const accent = team.color && TEAM_COLORS[team.color] ? TEAM_COLORS[team.color] : parentAccent;
      const headCount = countPeople(team, showOpenRoles);
      const [editingName, setEditingName] = useState(false);
      const [draftName, setDraftName] = useState(team.name);
      const [dragOverBody, setDragOverBody] = useState(false);
      const [dragOverHead, setDragOverHead] = useState(false);

      const visiblePeople = useMemo(() => showOpenRoles ? (team.people || []) : (team.people || []).filter(p => !p.isTBD), [team.people, showOpenRoles]);

      const handleBodyDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragOverBody(false);
        const pid = e.dataTransfer.getData("personId");
        if (pid) onMovePerson(pid, team.id);
      };
      const handleHeadDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragOverHead(false);
        const pid = e.dataTransfer.getData("personId");
        if (pid) onMakeHead(pid, team.id);
      };

      return (
        <div className="flex flex-col items-center w-full">
          <div
            className={`rounded-xl shadow-md overflow-hidden w-full max-w-xs mb-2 transition-all ${dragOverBody ? "ring-2 ring-blue-400 scale-[1.01]" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOverBody(true); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverBody(false); }}
            onDrop={handleBodyDrop}
          >
            <div className={`${accent.bg} text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none`} onClick={() => onToggleCollapse(team.id)}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {team.logo === "crombie" && <CrombieLogo size={22} />}
                {team.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                {editingName
                  ? <input className="bg-white/20 rounded px-1 text-sm text-white w-full" value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={() => { onUpdateTeam(team.id, { name: draftName }); setEditingName(false); }} onKeyDown={e => { if (e.key === "Enter") { onUpdateTeam(team.id, { name: draftName }); setEditingName(false); } }} onClick={e => e.stopPropagation()} autoFocus />
                  : <span className="font-semibold text-sm truncate" onDoubleClick={e => { e.stopPropagation(); setEditingName(true); }}>{team.name}</span>}
              </div>
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1 ml-2 shrink-0"><Users size={12} />{headCount}</span>
            </div>

            {!team.collapsed && (
              <div
                className={`border-b ${accent.border} transition-all`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverHead(true); setDragOverBody(false); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverHead(false); }}
                onDrop={handleHeadDrop}
              >
                {team.head ? (
                  <div className={`${accent.light} px-3 py-2`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Crown size={11} className={accent.text} />
                    </div>
                    <PersonCard person={team.head} accent={accent} onUpdate={p => onUpdateTeam(team.id, { head: p })} onDelete={() => onUpdateTeam(team.id, { head: null })} isSearchMatch={searchIds.has(team.head.id)} />
                  </div>
                ) : (
                  <div className={`px-3 py-2 transition-all ${dragOverHead ? `${accent.light} ring-2 ring-inset ${accent.border}` : "bg-white/60"}`}>
                    <div className={`border-2 border-dashed rounded-lg p-3 flex items-center justify-center gap-2 text-xs transition-all ${dragOverHead ? `${accent.border} ${accent.text} bg-white` : "border-gray-200 text-gray-400"}`}>
                      <Crown size={13} className={dragOverHead ? accent.text : "text-gray-300"} />
                      <span>{dragOverHead ? "Drop to set as department head" : "Drag a card here to set department head"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!team.collapsed && (
              <div className="bg-gray-50 px-3 py-1.5 flex gap-1 justify-end border-t border-gray-100">
                <button onClick={() => onAddPerson(team.id)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-blue-50"><Plus size={12} />Person</button>
                <button onClick={() => onAddSubteam(team.id)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-emerald-600 px-2 py-0.5 rounded hover:bg-emerald-50"><Plus size={12} />Team</button>
                <button onClick={() => { if (confirm("Delete team '" + team.name + "' and all contents?")) onDeleteTeam(team.id); }} className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50"><Trash2 size={12} /></button>
              </div>
            )}
          </div>

          {!team.collapsed && (
            <div className="flex flex-col items-center w-full">
              {visiblePeople.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-2 w-full px-2">
                  {visiblePeople.map(p => (
                    <PersonCard key={p.id} person={p} accent={accent}
                      onUpdate={up => onUpdatePerson(team.id, up)}
                      onDelete={id => onDeletePerson(team.id, id)}
                      isSearchMatch={searchIds.has(p.id)} />
                  ))}
                </div>
              )}
              {team.subteams?.length > 0 && (
                <div className="mt-4 w-full">
                  <div className="flex justify-center"><div className="w-px h-6 bg-gray-300" /></div>
                  {team.subteams.length > 1 && <div className="flex justify-center"><div className="h-px bg-gray-300" style={{ width: `${Math.min(team.subteams.length * 300, 1200)}px` }} /></div>}
                  <div className="flex flex-wrap gap-8 justify-center w-full">
                    {team.subteams.map(st => (
                      <div key={st.id} className="flex flex-col items-center" style={{ minWidth: 288 }}>
                        <div className="w-px h-4 bg-gray-300" />
                        <TeamNode team={st} accent={accent} depth={depth + 1} searchIds={searchIds} showOpenRoles={showOpenRoles}
                          onUpdateTeam={onUpdateTeam} onDeleteTeam={onDeleteTeam} onAddPerson={onAddPerson} onAddSubteam={onAddSubteam}
                          onUpdatePerson={onUpdatePerson} onDeletePerson={onDeletePerson} onMovePerson={onMovePerson} onMakeHead={onMakeHead} onToggleCollapse={onToggleCollapse} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    function buildPrintRows(teams, dept = "", reportsTo = "", rows = []) {
      teams.forEach(t => {
        const deptName = dept || t.name;
        if (t.head && !t.head.isTBD) {
          rows.push({ name: t.head.name, title: t.head.title || t.head.role || "", dept: t.name, reportsTo, isHead: true });
        }
        (t.people || []).filter(p => !p.isTBD).forEach(p => {
          rows.push({ name: p.name, title: p.title || p.role || "", dept: t.name, reportsTo: t.head ? t.head.name : reportsTo, isHead: false });
        });
        buildPrintRows(t.subteams || [], deptName, t.head ? t.head.name : reportsTo, rows);
      });
      return rows;
    }

    function PrintLayout({ teams }) {
      const grouped = useMemo(() => {
        const map = {};
        const walkTop = (list, topDept) => list.forEach(t => {
          const key = topDept || t.name;
          if (t.head && !t.head.isTBD) { (map[key] = map[key] || []).push({ name: t.head.name, title: t.head.title || t.head.role || "", team: t.name, reportsTo: "", isHead: true }); }
          (t.people || []).filter(p => !p.isTBD).forEach(p => { (map[key] = map[key] || []).push({ name: p.name, title: p.title || p.role || "", team: t.name, reportsTo: t.head?.name || "", isHead: false }); });
          walkTop(t.subteams || [], key);
        });
        teams.forEach(div => walkTop(div.subteams || [], ""));
        return map;
      }, [teams]);

      const depts = Object.keys(grouped);

      return (
        <div className="print-only p-6">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, borderBottom: "2px solid #1e3a5f", paddingBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#1e3a5f", letterSpacing: 1 }}>NFTY — By Aug 1</div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "#666" }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px" }}>
            {depts.map(dept => (
              <div key={dept} style={{ breakInside: "avoid", marginBottom: 4 }}>
                <div style={{ background: "#1e3a5f", color: "white", fontWeight: 700, fontSize: 8, letterSpacing: 0.5, padding: "2px 6px", borderRadius: "3px 3px 0 0", textTransform: "uppercase" }}>{dept}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 7.5 }}>
                  <thead>
                    <tr style={{ background: "#f0f4f8" }}>
                      <th style={{ padding: "1px 4px", textAlign: "left", fontWeight: 600, color: "#444", borderBottom: "1px solid #ddd", width: "55%" }}>Name</th>
                      <th style={{ padding: "1px 4px", textAlign: "left", fontWeight: 600, color: "#444", borderBottom: "1px solid #ddd", width: "45%" }}>Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[dept].map((r, i) => (
                      <tr key={i} style={{ background: r.isHead ? "#eef4ff" : (i % 2 === 0 ? "#fff" : "#fafafa"), borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "1px 4px", fontWeight: r.isHead ? 700 : 400, color: r.isHead ? "#1e3a5f" : "#222" }}>{r.isHead ? "★ " : ""}{r.name}</td>
                        <td style={{ padding: "1px 4px", color: "#555" }}>{r.team}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, fontSize: 8, color: "#999", textAlign: "center", borderTop: "1px solid #eee", paddingTop: 6 }}>
            NFTYDoor Organization Chart · ★ · Printed {new Date().toLocaleString()}
          </div>
        </div>
      );
    }

    function PasswordGate({ children }) {
      const [authed, setAuthed] = useState(() => {
        try { return sessionStorage.getItem(AUTH_KEY) === "1"; } catch { return false; }
      });
      const [pw, setPw] = useState("");
      const [err, setErr] = useState(false);

      const submit = (e) => {
        e.preventDefault();
        if (pw === SITE_PASSWORD) {
          try { sessionStorage.setItem(AUTH_KEY, "1"); } catch { /* ignore */ }
          setAuthed(true);
          setErr(false);
        } else {
          setErr(true);
        }
      };

      if (authed) return children;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-3">
              <NFTYDoorLogo size={48} />
              <h1 className="text-xl font-bold text-gray-800">NFTY — By Aug 1</h1>
              <p className="text-sm text-gray-500 text-center">Enter the password to view the organization chart.</p>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" autoFocus className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${err ? "border-red-300" : "border-gray-200"}`} placeholder="Password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} />
            </div>
            {err && <p className="text-xs text-red-600 text-center">Incorrect password. Please try again.</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Unlock</button>
          </form>
        </div>
      );
    }

    function NFTYOrgChart() {
      const [teams, setTeams] = useState(loadSavedData);
      const [search, setSearch] = useState("");
      const [exportMsg, setExportMsg] = useState("");
      const [showOpenRoles, setShowOpenRoles] = useState(true);
      const [saveStatus, setSaveStatus] = useState("saved");
      const [cloudState, setCloudState] = useState("loading");
      const saveTimer = useRef(null);

      useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const res = await fetchCloudState();
            if (cancelled) return;
            // No Blob store configured → local-only mode (no red error).
            if (res.status === 503) {
              setTeams(loadSavedData());
              setCloudState("off");
              return;
            }
            if (res.status === 404) {
              const local = loadSavedData();
              setTeams(local);
              const up = await saveCloudState(local);
              if (cancelled) return;
              setCloudState(up.ok ? "ready" : "error");
              return;
            }
            if (!res.ok) {
              setTeams(loadSavedData());
              setCloudState("error");
              return;
            }
            const data = await res.json();
            if (data && data.payload != null) {
              setTeams(normalizeTeams(data.payload));
              try {
                if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(data.payload));
              } catch { /* ignore */ }
              setCloudState("ready");
              return;
            }
            const local = loadSavedData();
            setTeams(local);
            const up = await saveCloudState(local);
            if (cancelled) return;
            setCloudState(up.ok ? "ready" : "error");
          } catch {
            if (cancelled) return;
            setTeams(loadSavedData());
            setCloudState("off");
          }
        })();
        return () => { cancelled = true; };
      }, []);

      useEffect(() => {
        if (!teams) return;
        setSaveStatus("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          const normalized = normalizeTeams(teams);
          try {
            if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            setSaveStatus("saved");
          } catch {
            setSaveStatus("error");
          }
          if (cloudState === "ready") {
            saveCloudState(normalized).then((res) => {
              if (!res.ok) console.warn("Shared cloud save failed:", res.status);
            }).catch((err) => {
              console.warn("Shared cloud save failed:", err);
            });
          }
        }, 600);
      }, [teams, cloudState]);

      const set = fn => setTeams(prev => fn(prev));

      const handleMovePerson = (personId, targetTeamId) => {
        setTeams(prev => {
          const [stripped, person] = excisePerson(prev, personId);
          if (!person) return prev;
          return injectPersonPeople(stripped, targetTeamId, person);
        });
      };

      const handleMakeHead = (personId, targetTeamId) => {
        setTeams(prev => {
          const [stripped, person] = excisePerson(prev, personId);
          if (!person) return prev;
          let next = stripped;
          const findHead = (list) => {
            for (const t of list) {
              if (t.id === targetTeamId) return t.head;
              const found = findHead(t.subteams || []);
              if (found) return found;
            }
            return null;
          };
          const existingHead = findHead(next);
          if (existingHead) {
            next = injectPersonPeople(next, targetTeamId, existingHead);
            next = updateTeamR(next, targetTeamId, { head: null });
          }
          return injectPersonHead(next, targetTeamId, person);
        });
      };

      const searchIds = useMemo(() => {
        if (!teams || !search.trim()) return new Set();
        const q = search.toLowerCase();
        return new Set(flattenPeople(teams).filter(p => {
          const title = p.title || p.role || "";
          return p.name.toLowerCase().includes(q) || title.toLowerCase().includes(q) || (p.workingHours || "").toLowerCase().includes(q);
        }).map(p => p.id));
      }, [search, teams]);

      const openRoles = useMemo(() => teams ? collectOpenRoles(teams) : [], [teams]);
      const totalPeople = useMemo(() => {
        if (!teams) return 0;
        let c = 0;
        const walk = list => list.forEach(t => { if (t.head && (showOpenRoles || !t.head.isTBD)) c++; c += (t.people || []).filter(p => showOpenRoles || !p.isTBD).length; walk(t.subteams || []); });
        walk(teams);
        return c;
      }, [teams, showOpenRoles]);

      const handleExport = () => {
        navigator.clipboard.writeText(JSON.stringify(teams, null, 2)).then(() => { setExportMsg("Copied!"); setTimeout(() => setExportMsg(""), 2000); }).catch(() => setExportMsg("Copy failed"));
      };
      const handleExportCSV = () => {
        const rows = [["Name", "Title", "Working Hours", "Team", "Reports To", "Status"]];
        const walk = (list, reportsTo) => list.forEach(t => {
          const mgr = t.head ? t.head.name : reportsTo;
          if (t.head) rows.push([t.head.name, t.head.title || t.head.role || "", t.head.workingHours || "", t.name, reportsTo || "", t.head.isTBD ? "Open Role" : "Filled"]);
          (t.people || []).forEach(p => rows.push([p.name, p.title || p.role || "", p.workingHours || "", t.name, mgr || "", p.isTBD ? "Open Role" : "Filled"]));
          walk(t.subteams || [], mgr);
        });
        walk(teams, "");
        const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "NFTYDoor-Org-Chart.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      };
      const handleImport = () => {
        const json = prompt("Paste JSON org data:"); if (!json) return;
        try { setTeams(JSON.parse(json)); } catch { alert("Invalid JSON"); }
      };
      const handlePrint = () => {
        setTeams(ts => {
          const ex = expandAllR(ts);
          setTimeout(() => {
            try {
              window.print();
            } catch (e) {
              alert("Print failed. Try Ctrl+P (or Cmd+P) to open the print dialog.");
            }
          }, 400);
          return ex;
        });
      };

      const sharedNodeProps = {
        searchIds, showOpenRoles,
        onUpdateTeam: (id, upd) => set(ts => updateTeamR(ts, id, upd)),
        onDeleteTeam: (id) => set(ts => deleteTeamR(ts, id)),
        onAddPerson: (id) => set(ts => addPersonR(ts, id)),
        onAddSubteam: (id) => set(ts => addSubteamR(ts, id)),
        onUpdatePerson: (tid, p) => set(ts => updatePersonR(ts, tid, p)),
        onDeletePerson: (tid, pid) => set(ts => deletePersonR(ts, tid, pid)),
        onMovePerson: handleMovePerson,
        onMakeHead: handleMakeHead,
        onToggleCollapse: (id) => set(ts => toggleCollapseR(ts, id)),
      };

      const managementRoot = teams?.find(t => t.name === "NFTY") || teams?.[0];
      const unallocatedTeam = teams?.find(t => t.name === "Unallocated");
      const mgmtBranches = managementRoot?.subteams || [];

      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
          <style>{`
            @media print {
              body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
              .no-print{display:none!important}
              .print-only{display:block!important}
              @page{size:landscape;margin:0.5in}
            }
            .print-only{display:none}
          `}</style>

          <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
            <div className="w-full px-4 py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <NFTYDoorLogo size={32} />
                <div>
                  <h1 className="text-xl font-bold text-gray-800 tracking-tight">NFTY — By Aug 1</h1>
                  <p className="text-xs text-gray-400 -mt-0.5">Organization Chart · {totalPeople} people</p>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] max-w-md relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Search by name, title, or hours…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
              </div>
              {search && searchIds.size > 0 && <span className="text-xs text-blue-600 font-medium">{searchIds.size} match{searchIds.size !== 1 ? "es" : ""}</span>}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {cloudState === "loading" && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">Cloud…</span>}
                {cloudState === "ready" && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700">Shared</span>}
                {cloudState === "off" && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">Local only</span>}
                {cloudState === "error" && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700" title="Shared save is unavailable. Edits still save in this browser.">Cloud error</span>}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${saveStatus === "saved" ? "bg-green-100 text-green-700" : saveStatus === "saving" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                  {saveStatus === "saved" ? "✓ Saved" : saveStatus === "saving" ? "Saving…" : "⚠ Save failed"}
                </span>
                <button onClick={() => setShowOpenRoles(v => !v)} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${showOpenRoles ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-300 text-gray-500"}`}>
                  {showOpenRoles ? <Eye size={14} /> : <EyeOff size={14} />}{openRoles.length} Open
                </button>
                <button onClick={() => set(ts => [...ts, makeTeam("New Division")])} className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"><Plus size={14} />Division</button>
                <button onClick={handlePrint} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"><Printer size={14} />Print</button>
                <button onClick={handleExportCSV} className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"><Download size={14} />Excel</button>
                <button onClick={handleExport} className="flex items-center gap-1 text-sm bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"><Copy size={14} />{exportMsg || "JSON"}</button>
                <button onClick={handleImport} className="flex items-center gap-1 text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"><Download size={14} />Import</button>
              </div>
            </div>
            <div className="bg-blue-50 border-t border-blue-100 px-4 py-1.5 flex items-center gap-2 text-xs text-blue-600">
              <Crown size={12} />
              <span>Drag any person card onto a team's <strong>crown drop zone</strong> to promote them to department head — or onto the team body to move them as a member.</span>
            </div>
          </div>

          <div className="no-print w-full px-4 py-8 overflow-x-auto">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl shadow-lg px-10 py-4 flex items-center gap-4">
                <NFTYDoorLogo size={48} />
                <div className="text-left">
                  <p className="font-bold text-xl tracking-wide">NFTY — By Aug 1</p>
                  <p className="text-xs opacity-80">Management</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center"><div className="w-px h-6 bg-gray-300" /></div>

            {managementRoot?.head && (
              <div className="flex justify-center mb-4">
                <PersonCard person={managementRoot.head} accent={ACCENT_COLORS[0]}
                  onUpdate={p => set(ts => updateTeamR(ts, managementRoot.id, { head: p }))}
                  onDelete={() => set(ts => updateTeamR(ts, managementRoot.id, { head: null }))}
                  isSearchMatch={searchIds.has(managementRoot.head.id)} />
              </div>
            )}

            <div className="flex justify-center"><div className="w-px h-6 bg-gray-300" /></div>
            <div className="flex justify-center"><div className="h-px bg-gray-300 w-2/3 max-w-4xl" /></div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-0 w-full">
              {mgmtBranches.map((branch, i) => {
                const grad = i === 0 ? "from-blue-600 to-blue-700" : "from-violet-600 to-violet-700";
                const border = i === 0 ? "border-blue-200" : "border-violet-200";
                const bg = i === 0 ? "bg-blue-50/40" : "bg-violet-50/40";

                return (
                  <div key={branch.id} className={`flex flex-col items-center rounded-2xl border ${border} ${bg} p-6 pt-0 overflow-x-auto min-w-0 w-full`}>
                    <div className="w-px h-6 bg-gray-300" />
                    {branch.head && (
                      <div className={`bg-gradient-to-r ${grad} text-white rounded-xl shadow-lg px-8 py-4 text-center mb-4 w-full max-w-xs`}>
                        <p className="text-xs uppercase tracking-widest opacity-80 mb-1">{branch.head.title}</p>
                        <p className="font-bold text-lg">{branch.head.name}</p>
                      </div>
                    )}
                    <div className="w-px h-4 bg-gray-300" />

                    {branch.subteams?.length > 0 && (
                      <>
                        {branch.subteams.length > 1 && <div className="flex justify-center w-full"><div className="h-px bg-gray-300" style={{ width: `${Math.min(branch.subteams.length * 320, 900)}px` }} /></div>}
                        <div className="flex flex-wrap gap-8 justify-center w-full">
                          {branch.subteams.map((st, si) => (
                            <div key={st.id} className="flex flex-col items-center" style={{ minWidth: 288 }}>
                              <div className="w-px h-4 bg-gray-300" />
                              <TeamNode team={st} accent={ACCENT_COLORS[(i * 4 + si) % ACCENT_COLORS.length]} depth={1} {...sharedNodeProps} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {unallocatedTeam && (
              <div className="w-full mt-12">
                <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                  <div className="bg-slate-600 text-white px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <h2 className="font-semibold text-sm">Unallocated — {(unallocatedTeam.people || []).filter(p => showOpenRoles || !p.isTBD).length} people</h2>
                    </div>
                    <p className="text-xs opacity-80">Drag people into teams above when ready</p>
                  </div>
                  <div className="p-6 bg-slate-50"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const pid = e.dataTransfer.getData("personId"); if (pid) handleMovePerson(pid, unallocatedTeam.id); }}>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {(showOpenRoles ? (unallocatedTeam.people || []) : (unallocatedTeam.people || []).filter(p => !p.isTBD)).map(p => (
                        <PersonCard key={p.id} person={p} accent={TEAM_COLORS.slate}
                          onUpdate={up => set(ts => updatePersonR(ts, unallocatedTeam.id, up))}
                          onDelete={id => set(ts => deletePersonR(ts, unallocatedTeam.id, id))}
                          isSearchMatch={searchIds.has(p.id)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {openRoles.length > 0 && (
              <div className="w-full max-w-3xl mx-auto mt-12 mb-4">
                <div className="bg-white rounded-xl shadow-md border border-amber-200 overflow-hidden">
                  <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <h2 className="font-semibold text-amber-800 text-sm">Hiring Summary — {openRoles.length} Open Position{openRoles.length !== 1 ? "s" : ""}</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 text-left text-gray-500"><th className="px-6 py-2 font-medium">#</th><th className="px-6 py-2 font-medium">Position</th><th className="px-6 py-2 font-medium">Team</th><th className="px-6 py-2 font-medium">Hiring Manager</th></tr></thead>
                    <tbody>{openRoles.map((r, idx) => <tr key={idx} className="border-b border-gray-50 hover:bg-amber-50/50"><td className="px-6 py-2 text-gray-400">{idx + 1}</td><td className="px-6 py-2 font-medium text-gray-800">{r.title}</td><td className="px-6 py-2 text-gray-600">{r.team}</td><td className="px-6 py-2 text-gray-600">{r.hiringManager}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="no-print text-center py-6 text-xs text-gray-400">NFTYDoor Org Chart — Click any card to edit · Drag to move · {new Date().toLocaleDateString()}</div>

          <PrintLayout teams={teams} />
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<PasswordGate><NFTYOrgChart /></PasswordGate>);