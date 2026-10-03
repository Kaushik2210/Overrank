import type {
  Achievement,
  Analytics,
  AppSettings,
  AuditLog,
  AwardInput,
  AwardResult,
  Category,
  Dispute,
  EventItem,
  Notification,
  PointTransaction,
  RosterPreview,
  RosterRow,
  Session,
  Student,
  StudentDetail,
  StudentStanding,
  Suggestion,
  Team,
  TeamDetail,
  TeamStanding,
  TxQuery,
} from "./types";

/**
 * Everything the UI needs from storage. Two implementations exist: Supabase (real)
 * and an in-memory store (preview mode, used when no Supabase env vars are set).
 * All mutations take the acting session so the audit log is filled in one place.
 */
export interface Repo {
  mode: "supabase" | "preview";

  getSettings(): Promise<AppSettings>;
  updateSettings(actor: Session, patch: Partial<AppSettings>): Promise<AppSettings>;

  getTeams(): Promise<TeamStanding[]>;
  getTeam(slug: string): Promise<TeamDetail | null>;
  updateTeam(actor: Session, id: string, patch: Partial<Pick<Team, "name" | "motto" | "colorPrimary" | "colorGlow">>): Promise<void>;

  getStudents(): Promise<StudentStanding[]>;
  getStudent(id: string): Promise<StudentDetail | null>;
  searchStudents(q: string, limit?: number): Promise<StudentStanding[]>;

  getCategories(): Promise<Category[]>;
  createCategory(actor: Session, input: Pick<Category, "name" | "icon" | "color">): Promise<Category>;

  listTransactions(q: TxQuery): Promise<{ rows: PointTransaction[]; total: number }>;
  getTransaction(id: string): Promise<PointTransaction | null>;
  awardPoints(actor: Session, input: AwardInput): Promise<AwardResult>;
  reverseTransaction(actor: Session, id: string, note: string): Promise<void>;

  listEvents(): Promise<EventItem[]>;
  getEvent(id: string): Promise<EventItem | null>;
  saveEvent(actor: Session, input: Partial<EventItem> & Pick<EventItem, "title">): Promise<EventItem>;
  deleteEvent(actor: Session, id: string): Promise<void>;
  registerForEvent(actor: Session, eventId: string): Promise<EventItem>;
  setEventWinner(actor: Session, eventId: string, teamId: string, awardPoints: boolean): Promise<void>;

  listAchievements(studentId?: string): Promise<(Achievement & { unlockedAt: string | null; unlockedBy: number })[]>;
  saveAchievement(actor: Session, input: Partial<Achievement> & Pick<Achievement, "name">): Promise<Achievement>;
  grantAchievement(actor: Session, achievementId: string, studentId: string): Promise<void>;

  listSuggestions(filter?: { studentId?: string; status?: string }): Promise<Suggestion[]>;
  createSuggestion(actor: Session, input: Pick<Suggestion, "activity" | "description" | "categoryId" | "suggestedPoints" | "evidenceUrl">): Promise<Suggestion>;
  reviewSuggestion(actor: Session, id: string, decision: "approved" | "rejected", points: number | null, note: string): Promise<void>;

  listDisputes(filter?: { studentId?: string; status?: string }): Promise<Dispute[]>;
  createDispute(actor: Session, input: Pick<Dispute, "transactionId" | "reason" | "evidenceUrl">): Promise<Dispute>;
  resolveDispute(actor: Session, id: string, decision: "corrected" | "modified" | "rejected", newAmount: number | null, note: string): Promise<void>;

  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(userId: string, id: string | "all"): Promise<void>;
  dismissNotification(userId: string, id: string): Promise<void>;

  listAudit(limit?: number): Promise<AuditLog[]>;
  getAnalytics(): Promise<Analytics>;

  previewRoster(rows: RosterRow[]): Promise<RosterPreview>;
  commitRoster(actor: Session, rows: RosterRow[]): Promise<{ added: number; updated: number }>;

  /** Admin-only overview numbers for the command centre. */
  getOverview(): Promise<{ students: number; teams: number; pointsAwarded: number; activeEvents: number; pendingSuggestions: number; pendingDisputes: number }>;

  /** Used by the sign-in flow. */
  findStudent(id: string): Promise<Student | null>;
}
