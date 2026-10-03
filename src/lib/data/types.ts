export type Role = "teacher" | "admin";

export type Team = {
  id: string;
  name: string;
  slug: string;
  colorPrimary: string;
  colorGlow: string;
  motto: string;
};

export type TeamStanding = Team & {
  points: number;
  rank: number;
  weeklyGrowth: number;
  memberCount: number;
  achievementCount: number;
  previousRank: number;
};

export type Student = {
  id: string; // the college student ID
  name: string;
  teamId: string;
};

export type StudentStanding = Student & {
  points: number;
  xp: number;
  level: number;
  levelProgress: number; // 0..1 into current level
  xpToNext: number;
  rank: number; // overall
  teamRank: number;
  teamContribution: number; // 0..1
  teamSlug: string;
  teamName: string;
  teamColor: string;
  teamGlow: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

export type TxStatus = "active" | "reversed" | "pending";

export type PointTransaction = {
  id: string;
  studentId: string;
  studentName: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  amount: number;
  type: "award" | "deduction";
  categoryId: string;
  categoryName: string;
  reason: string;
  eventId: string | null;
  eventTitle: string | null;
  awardedBy: string;
  createdAt: string;
  status: TxStatus;
  evidenceUrl: string | null;
  reversesId: string | null;
  isDemo: boolean;
};

export type EventStatus = "upcoming" | "live" | "past";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  points: number;
  categoryId: string;
  categoryName: string;
  status: EventStatus;
  location: string;
  teamIds: string[];
  winnerTeamId: string | null;
  registeredCount: number;
  isDemo: boolean;
};

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xp: number;
  rule: { kind: "manual" } | { kind: "points"; threshold: number } | { kind: "category"; categoryId: string; threshold: number };
  isDemo: boolean;
};

export type StudentAchievement = {
  achievementId: string;
  studentId: string;
  unlockedAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
};

export type XpSettings = {
  /** xp per point */
  xpPerPoint: number;
  /** cumulative xp needed to reach level N+1 is thresholds[N-1]; beyond the list uses the last gap */
  thresholds: number[];
};

export type AppSettings = {
  xp: XpSettings;
  siteName: string;
  tagline: string;
};

export type Session = {
  userId: string;
  role: Role;
  name: string;
};

export type AwardInput = {
  studentIds: string[];
  amount: number;
  categoryId: string;
  reason: string;
  eventId?: string | null;
  evidenceUrl?: string | null;
};

export type AwardResult = {
  transactions: PointTransaction[];
  teamBefore: { rank: number; points: number };
  teamAfter: { rank: number; points: number; name: string };
  leaderChanged: boolean;
  unlocked: UnlockedAchievement[];
};

export type ActivityPoint = { date: string; [teamSlug: string]: number | string };

export type UnlockedAchievement = { studentId: string; studentName: string; achievement: Achievement };

export type TeamDetail = {
  team: TeamStanding;
  members: StudentStanding[];
  topContributors: StudentStanding[];
  achievements: { achievement: Achievement; count: number }[];
  eventsWon: EventItem[];
  history: PointTransaction[];
  categoryPerformance: { categoryId: string; name: string; color: string; points: number }[];
  weekly: { week: string; points: number; total: number }[];
  timeline: { at: string; kind: "event" | "award" | "achievement"; title: string; detail: string }[];
};

export type StudentDetail = {
  student: StudentStanding;
  achievements: (Achievement & { unlockedAt: string | null })[];
  transactions: PointTransaction[];
  categoryBreakdown: { categoryId: string; name: string; color: string; points: number }[];
};

export type TxQuery = {
  q?: string;
  teamId?: string;
  categoryId?: string;
  studentId?: string;
  status?: TxStatus;
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
};

export type Analytics = {
  pointsOverTime: ActivityPoint[];
  teamPerformance: { slug: string; name: string; color: string; points: number }[];
  categoryDistribution: { name: string; color: string; points: number }[];
  topContributors: StudentStanding[];
  participation: { slug: string; name: string; color: string; active: number; total: number }[];
  heatmap: { team: string; color: string; cells: { category: string; points: number }[] }[];
};

export type RosterRow = { team: string; studentId: string; name: string };
export type RosterIssue = { row: number; message: string };
export type RosterPreview = {
  valid: RosterRow[];
  issues: RosterIssue[];
  adds: number;
  updates: number;
};
