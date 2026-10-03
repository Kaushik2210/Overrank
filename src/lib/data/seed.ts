import roster from "../../../data/roster.json";
import { DEFAULT_XP } from "@/lib/xp";
import type {
  Achievement,
  AppSettings,
  AuditLog,
  Category,
  Dispute,
  EventItem,
  Notification,
  PointTransaction,
  Student,
  StudentAchievement,
  Suggestion,
  Team,
} from "./types";

export type Store = {
  teams: Team[];
  students: Student[];
  categories: Category[];
  transactions: PointTransaction[];
  events: EventItem[];
  registrations: { eventId: string; studentId: string }[];
  achievements: Achievement[];
  studentAchievements: StudentAchievement[];
  suggestions: Suggestion[];
  disputes: Dispute[];
  notifications: Notification[];
  audit: AuditLog[];
  settings: AppSettings;
  demoLoaded: boolean;
};

const MOTTOS: Record<string, string> = {
  slytherin: "Ambition in every move.",
  "the-nine-nine": "Precision. Teamwork. Results.",
  anakonda: "Strike with patience.",
  "tech-titans": "Build. Ship. Dominate.",
  "strange-things": "Embrace the unexpected.",
  "upside-down": "See it from a new angle.",
};

export const CATEGORIES: Category[] = [
  { id: "cat_academics", name: "Academics", slug: "academics", icon: "GraduationCap", color: "#60a5fa" },
  { id: "cat_participation", name: "Participation", slug: "participation", icon: "Hand", color: "#34d399" },
  { id: "cat_exams", name: "Exams", slug: "exams", icon: "FileCheck", color: "#a78bfa" },
  { id: "cat_fests", name: "Fests", slug: "fests", icon: "PartyPopper", color: "#f472b6" },
  { id: "cat_sports", name: "Sports", slug: "sports", icon: "Trophy", color: "#fbbf24" },
  { id: "cat_hackathons", name: "Hackathons", slug: "hackathons", icon: "Code2", color: "#22d3ee" },
  { id: "cat_competitions", name: "Competitions", slug: "competitions", icon: "Swords", color: "#fb7185" },
  { id: "cat_volunteering", name: "Volunteering", slug: "volunteering", icon: "HeartHandshake", color: "#4ade80" },
  { id: "cat_events", name: "Events", slug: "events", icon: "CalendarCheck", color: "#38bdf8" },
  { id: "cat_leadership", name: "Leadership", slug: "leadership", icon: "Crown", color: "#fcd34d" },
  { id: "cat_exceptional", name: "Exceptional", slug: "exceptional", icon: "Sparkles", color: "#e879f9" },
  { id: "cat_other", name: "Other", slug: "other", icon: "Shapes", color: "#94a3b8" },
];

export const CORE_ACHIEVEMENTS: Achievement[] = [
  { id: "ach_first_blood", name: "First Blood", description: "Earn your first points.", icon: "Zap", rarity: "common", xp: 25, rule: { kind: "points", threshold: 1 }, isDemo: false },
  { id: "ach_century", name: "Century", description: "Reach 100 personal points.", icon: "Target", rarity: "rare", xp: 100, rule: { kind: "points", threshold: 100 }, isDemo: false },
  { id: "ach_half_k", name: "Heavy Hitter", description: "Reach 500 personal points.", icon: "Flame", rarity: "epic", xp: 250, rule: { kind: "points", threshold: 500 }, isDemo: false },
  { id: "ach_thousand", name: "Legend", description: "Reach 1,000 personal points.", icon: "Crown", rarity: "legendary", xp: 500, rule: { kind: "points", threshold: 1000 }, isDemo: false },
  { id: "ach_sportsperson", name: "Sportsperson", description: "Earn 60 points in Sports.", icon: "Medal", rarity: "rare", xp: 100, rule: { kind: "category", categoryId: "cat_sports", threshold: 60 }, isDemo: false },
  { id: "ach_captain", name: "Captain Material", description: "Awarded by a teacher for outstanding leadership.", icon: "Shield", rarity: "epic", xp: 200, rule: { kind: "manual" }, isDemo: false },
];

type DemoAch = Omit<Achievement, "isDemo">;
const DEMO_ACHIEVEMENTS: DemoAch[] = [
  { id: "ach_d_scholar", name: "Scholar", description: "Earn 80 points in Academics.", icon: "GraduationCap", rarity: "rare", xp: 100, rule: { kind: "category", categoryId: "cat_academics", threshold: 80 } },
  { id: "ach_d_hacker", name: "Hackathon Hero", description: "Earn 100 points in Hackathons.", icon: "Code2", rarity: "epic", xp: 200, rule: { kind: "category", categoryId: "cat_hackathons", threshold: 100 } },
  { id: "ach_d_helper", name: "Helping Hand", description: "Earn 50 points volunteering.", icon: "HeartHandshake", rarity: "common", xp: 60, rule: { kind: "category", categoryId: "cat_volunteering", threshold: 50 } },
  { id: "ach_d_showman", name: "Showstopper", description: "Earn 60 points at fests.", icon: "PartyPopper", rarity: "rare", xp: 100, rule: { kind: "category", categoryId: "cat_fests", threshold: 60 } },
  { id: "ach_d_gladiator", name: "Gladiator", description: "Earn 80 points in Competitions.", icon: "Swords", rarity: "epic", xp: 180, rule: { kind: "category", categoryId: "cat_competitions", threshold: 80 } },
  { id: "ach_d_regular", name: "Regular", description: "Earn 30 points for participation.", icon: "Hand", rarity: "common", xp: 40, rule: { kind: "category", categoryId: "cat_participation", threshold: 30 } },
  { id: "ach_d_300", name: "On Fire", description: "Reach 300 personal points.", icon: "Flame", rarity: "rare", xp: 150, rule: { kind: "points", threshold: 300 } },
  { id: "ach_d_750", name: "Unstoppable", description: "Reach 750 personal points.", icon: "Rocket", rarity: "legendary", xp: 400, rule: { kind: "points", threshold: 750 } },
  { id: "ach_d_mvp", name: "Season MVP", description: "Named most valuable player by the faculty.", icon: "Star", rarity: "legendary", xp: 600, rule: { kind: "manual" } },
  { id: "ach_d_mentor", name: "Mentor", description: "Guided juniors through the season.", icon: "Users", rarity: "rare", xp: 120, rule: { kind: "manual" } },
  { id: "ach_d_spirit", name: "House Spirit", description: "Showed exceptional team spirit.", icon: "Heart", rarity: "common", xp: 50, rule: { kind: "manual" } },
  { id: "ach_d_streak", name: "Consistent", description: "Recognised for steady effort across the season.", icon: "Layers", rarity: "common", xp: 60, rule: { kind: "manual" } },
  { id: "ach_d_exam", name: "Exam Ace", description: "Earn 60 points in Exams.", icon: "FileCheck", rarity: "rare", xp: 100, rule: { kind: "category", categoryId: "cat_exams", threshold: 60 } },
  { id: "ach_d_leader", name: "Born Leader", description: "Earn 50 points in Leadership.", icon: "Crown", rarity: "epic", xp: 180, rule: { kind: "category", categoryId: "cat_leadership", threshold: 50 } },
];

/** Placeholder launch events an admin can edit or delete. Not flagged demo. */
function launchEvents(now: number): EventItem[] {
  const day = 86400000;
  const mk = (id: string, title: string, d: number, pts: number, cat: string, catName: string, location: string, description: string): EventItem => ({
    id,
    title,
    description,
    startsAt: new Date(now + d * day).toISOString(),
    endsAt: new Date(now + d * day + 3 * 3600000).toISOString(),
    points: pts,
    categoryId: cat,
    categoryName: catName,
    status: "upcoming",
    location,
    teamIds: [],
    winnerTeamId: null,
    registeredCount: 0,
    isDemo: false,
  });
  return [
    mk("evt_opening", "Opening Ceremony", 5, 25, "cat_participation", "Participation", "Main Auditorium", "The season begins. Every student present earns participation points."),
    mk("evt_quiz", "Inter-House Quiz", 14, 100, "cat_competitions", "Competitions", "Seminar Hall", "A general knowledge quiz. One team of four per house."),
    mk("evt_hack", "House Hackathon", 30, 200, "cat_hackathons", "Hackathons", "Computer Lab Block", "Twelve hours to build something worth showing."),
  ];
}

export function buildStore(opts: { demo: boolean; now?: number } = { demo: false }): Store {
  const now = opts.now ?? Date.now();
  const teams: Team[] = roster.teams.map((t) => ({
    id: `team_${t.slug}`,
    name: t.name,
    slug: t.slug,
    colorPrimary: t.colorPrimary,
    colorGlow: t.colorGlow,
    motto: MOTTOS[t.slug] ?? "Every point counts.",
  }));
  const students: Student[] = roster.teams.flatMap((t) =>
    t.members.map((m) => ({ id: m.studentId, name: m.name, teamId: `team_${t.slug}` })),
  );

  const store: Store = {
    teams,
    students,
    categories: CATEGORIES.map((c) => ({ ...c })),
    transactions: [],
    events: launchEvents(now),
    registrations: [],
    achievements: CORE_ACHIEVEMENTS.map((a) => ({ ...a })),
    studentAchievements: [],
    suggestions: [],
    disputes: [],
    notifications: [],
    audit: [],
    settings: {
      xp: { ...DEFAULT_XP, thresholds: [...DEFAULT_XP.thresholds] },
      siteName: "HOUSECORE",
      tagline: "EVERY POINT COUNTS.",
    },
    demoLoaded: false,
  };

  if (opts.demo) addDemo(store, now);
  return store;
}

/* ------------------------------------------------------------------ demo data */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REASONS: Record<string, string[]> = {
  cat_academics: ["Top score in internals", "Dean's list mention", "Research poster selected", "Perfect lab record"],
  cat_participation: ["Attended house assembly", "Helped with stage setup", "Active in club session", "Joined the orientation walk"],
  cat_exams: ["Highest in class test", "Cleared mock exam with distinction", "Perfect attendance during exams"],
  cat_fests: ["Performed at cultural night", "Ran the house stall", "Stage anchor for the fest", "Won the dance showdown"],
  cat_sports: ["Won the 100m sprint", "Scored in the football final", "Basketball semi-final MVP", "Relay team gold"],
  cat_hackathons: ["Finalist at the 24h hack", "Best UI at the hackathon", "Shipped a working demo", "Mentored a rookie team"],
  cat_competitions: ["Quiz finals winner", "Debate best speaker", "Chess tournament runner-up", "Won the coding contest"],
  cat_volunteering: ["Blood donation drive", "Campus cleanup lead", "Teaching at the outreach camp", "Food drive helper"],
  cat_events: ["Organised the guest lecture", "Managed registrations", "Event photography"],
  cat_leadership: ["Led the house meeting", "Captained the team", "Coordinated the volunteer roster"],
  cat_exceptional: ["Represented the college at state level", "Published a paper", "Outstanding act of integrity"],
  cat_other: ["Teacher's discretionary award", "Helped a classmate through a tough week"],
};

const RANGE: Record<string, [number, number]> = {
  cat_academics: [10, 40],
  cat_participation: [5, 15],
  cat_exams: [15, 50],
  cat_fests: [10, 40],
  cat_sports: [15, 60],
  cat_hackathons: [30, 100],
  cat_competitions: [20, 80],
  cat_volunteering: [10, 30],
  cat_events: [5, 20],
  cat_leadership: [15, 40],
  cat_exceptional: [50, 150],
  cat_other: [5, 25],
};

export const DEMO_ADMIN_NAME = "Faculty Admin";

function addDemo(s: Store, now: number) {
  const rnd = mulberry32(2026);
  const pick = <T>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const day = 86400000;
  const strength = [0.95, 1.0, 1.1, 1.35, 0.8, 1.2];

  // events: 4 past, 2 live, 4 upcoming
  const demoEvents: [string, string, number, number, string, string][] = [
    ["Orientation Run", "Campus 5K to kick off the season.", -52, 40, "cat_sports", "Main Ground"],
    ["Code Sprint", "A three hour algorithms contest.", -38, 90, "cat_hackathons", "Computer Lab"],
    ["Cultural Night", "Music, dance and drama from every house.", -24, 80, "cat_fests", "Open Air Theatre"],
    ["Debate League", "Rapid-fire debates, house vs house.", -11, 70, "cat_competitions", "Seminar Hall"],
    ["Blood Donation Drive", "Partnering with the city blood bank.", 0, 30, "cat_volunteering", "Health Centre"],
    ["Hall of Fame Quiz", "Live buzzer-round quiz.", 0, 60, "cat_competitions", "Auditorium"],
    ["Inter-House Football", "Knockout bracket across all six houses.", 9, 120, "cat_sports", "Football Ground"],
    ["Design Jam", "Poster and UI challenge in two hours.", 16, 60, "cat_competitions", "Design Studio"],
    ["Tech Expo", "Open demos of student projects.", 23, 100, "cat_hackathons", "Exhibition Hall"],
    ["Season Finale", "Awards night and trophy handover.", 45, 150, "cat_events", "Main Auditorium"],
  ];
  demoEvents.forEach(([title, description, d, points, cat, location], i) => {
    const live = d === 0;
    const startsAt = live ? now - 3600000 : now + d * day;
    const status = d < 0 ? "past" : live ? "live" : "upcoming";
    s.events.push({
      id: `evt_demo_${String(i + 1).padStart(2, "0")}`,
      title,
      description,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(live ? now + 2 * day : startsAt + 3 * 3600000).toISOString(),
      points,
      categoryId: cat,
      categoryName: s.categories.find((c) => c.id === cat)!.name,
      status,
      location,
      teamIds: s.teams.map((t) => t.id),
      winnerTeamId: status === "past" ? pick(s.teams).id : null,
      registeredCount: 18 + Math.floor(rnd() * 30),
      isDemo: true,
    });
  });

  // transactions across the last 8 weeks
  const byTeam = s.teams.map((t) => s.students.filter((x) => x.teamId === t.id));
  const total = 168;
  const weightSum = strength.reduce((a, b) => a + b, 0);
  const pastEvents = s.events.filter((e) => e.isDemo && e.status !== "upcoming");
  for (let i = 0; i < total; i++) {
    let r = rnd() * weightSum;
    let ti = 0;
    for (; ti < strength.length - 1; ti++) {
      r -= strength[ti];
      if (r <= 0) break;
    }
    const team = s.teams[ti];
    const members = byTeam[ti];
    // skew so a few students stand out
    const student = members[Math.floor(Math.pow(rnd(), 1.7) * members.length)];
    const cat = pick(s.categories);
    const [lo, hi] = RANGE[cat.id];
    const deduction = rnd() < 0.1;
    const mag = Math.round((lo + rnd() * (hi - lo)) / 5) * 5 || 5;
    const amount = deduction ? -Math.max(5, Math.round(mag / 3 / 5) * 5) : mag;
    const age = Math.pow(rnd(), 0.8) * 56 * day;
    const evt = !deduction && rnd() < 0.35 ? pick(pastEvents) : null;
    s.transactions.push({
      id: `tx_demo_${String(i + 1).padStart(3, "0")}`,
      studentId: student.id,
      studentName: student.name,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.colorPrimary,
      amount,
      type: deduction ? "deduction" : "award",
      categoryId: cat.id,
      categoryName: cat.name,
      reason: deduction ? pick(["Missed the mandatory assembly", "Late to house check-in", "Equipment returned damaged"]) : pick(REASONS[cat.id]),
      eventId: evt?.id ?? null,
      eventTitle: evt?.title ?? null,
      awardedBy: DEMO_ADMIN_NAME,
      createdAt: new Date(now - age).toISOString(),
      status: "active",
      evidenceUrl: null,
      reversesId: null,
      isDemo: true,
    });
  }
  s.transactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // three reversals: original is flagged, a compensating row cancels it
  for (const tx of s.transactions.filter((t) => t.amount > 20 && t.type === "award").slice(5, 8)) {
    tx.status = "reversed";
    s.transactions.push({
      ...tx,
      id: `${tx.id}_rev`,
      amount: -tx.amount,
      type: "deduction",
      reason: `Reversal: ${tx.reason}`,
      createdAt: new Date(new Date(tx.createdAt).getTime() + 2 * day).toISOString(),
      status: "active",
      reversesId: tx.id,
    });
  }
  s.transactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // achievements: derive unlocks from the demo ledger
  s.achievements.push(...DEMO_ACHIEVEMENTS.map((a) => ({ ...a, isDemo: true })));
  const totals = new Map<string, number>();
  const catTotals = new Map<string, number>();
  for (const t of s.transactions) {
    if (t.status === "pending") continue;
    totals.set(t.studentId, (totals.get(t.studentId) ?? 0) + t.amount);
    const k = `${t.studentId}|${t.categoryId}`;
    catTotals.set(k, (catTotals.get(k) ?? 0) + t.amount);
  }
  for (const st of s.students) {
    for (const a of s.achievements) {
      const when = new Date(now - rnd() * 40 * day).toISOString();
      const hit =
        a.rule.kind === "points"
          ? (totals.get(st.id) ?? 0) >= a.rule.threshold
          : a.rule.kind === "category"
            ? (catTotals.get(`${st.id}|${a.rule.categoryId}`) ?? 0) >= a.rule.threshold
            : rnd() < 0.04;
      if (hit) s.studentAchievements.push({ achievementId: a.id, studentId: st.id, unlockedAt: when });
    }
  }

  // suggestions
  const sugg: [string, string, number, "pending" | "approved" | "rejected"][] = [
    ["Organised a coding workshop", "cat_events", 40, "pending"],
    ["Won inter-college chess", "cat_competitions", 60, "approved"],
    ["Weekend blood donation camp", "cat_volunteering", 30, "pending"],
    ["Published a short paper", "cat_academics", 80, "pending"],
    ["Led a cleanup of the east block", "cat_volunteering", 25, "approved"],
    ["Won a state-level debate", "cat_competitions", 90, "rejected"],
    ["Mentored first-years for 4 weeks", "cat_leadership", 50, "pending"],
    ["Designed the fest poster", "cat_fests", 30, "approved"],
  ];
  sugg.forEach(([activity, cat, pts, status], i) => {
    const st = s.students[(i * 7 + 3) % s.students.length];
    s.suggestions.push({
      id: `sug_demo_${i + 1}`,
      studentId: st.id,
      studentName: st.name,
      teamId: st.teamId,
      activity,
      description: `${activity}. Happy to share photos and a short write-up if needed.`,
      categoryId: cat,
      categoryName: s.categories.find((c) => c.id === cat)!.name,
      suggestedPoints: pts,
      evidenceUrl: null,
      status,
      reviewNote:
        status === "rejected"
          ? "Outside the season window. Please resubmit with dates."
          : status === "approved"
            ? "Approved as suggested."
            : null,
      awardedPoints: status === "approved" ? pts : null,
      createdAt: new Date(now - (i + 1) * 2.3 * day).toISOString(),
      isDemo: true,
    });
  });

  // disputes
  const disputable = s.transactions.filter((t) => t.status === "active" && !t.reversesId).slice(10, 14);
  const dReasons = [
    "I was not present at this event.",
    "Points look lower than the rubric.",
    "This should have been a team award.",
    "Duplicate entry for the same activity.",
  ];
  disputable.forEach((tx, i) => {
    const resolved = i === 3;
    s.disputes.push({
      id: `dis_demo_${i + 1}`,
      transactionId: tx.id,
      studentId: tx.studentId,
      studentName: tx.studentName,
      reason: dReasons[i],
      evidenceUrl: null,
      status: resolved ? "approved" : "pending",
      resolution: resolved ? "corrected" : null,
      reviewNote: resolved ? "Duplicate confirmed and corrected." : null,
      createdAt: new Date(now - (i + 1) * 1.4 * day).toISOString(),
      transaction: null,
      isDemo: true,
    });
  });

  // notifications
  const notes: [string, string, Notification["kind"], number][] = [
    ["Rank update", "A house has moved up to #1.", "rank", 1],
    ["New event", "Inter-House Football registration is open.", "event", 2],
    ["Points awarded", "New points were added to the ledger.", "points", 3],
    ["Achievement unlocked", "A new badge is waiting in the gallery.", "achievement", 5],
    ["Suggestion reviewed", "A suggestion was approved.", "review", 6],
    ["Welcome to HOUSECORE", "Every point counts. Good luck this season.", "system", 40],
  ];
  notes.forEach(([title, body, kind, ago], i) =>
    s.notifications.push({
      id: `ntf_demo_${i + 1}`,
      userId: "all",
      title,
      body,
      kind,
      read: i > 3,
      createdAt: new Date(now - ago * day).toISOString(),
    }),
  );

  // audit trail for the most recent awards
  for (const tx of s.transactions.filter((t) => !t.reversesId).slice(-12)) {
    s.audit.push({
      id: `aud_demo_${tx.id}`,
      actorId: "admin",
      actorName: DEMO_ADMIN_NAME,
      action: tx.amount >= 0 ? "points.award" : "points.deduct",
      target: tx.studentName,
      detail: `${tx.amount > 0 ? "+" : ""}${tx.amount} in ${tx.categoryName}: ${tx.reason}`,
      createdAt: tx.createdAt,
    });
  }
  s.audit.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  s.demoLoaded = true;
}
