"use client";

import { motion } from "motion/react";
import { Award, BarChart3, CalendarPlus, CalendarDays, Command as CommandIcon, Gauge, MoreHorizontal, Plus, Search, Settings, Trophy, Users, UserSquare2, type LucideIcon } from "lucide-react";
import { Command } from "cmdk";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/nav/Logo";
import { UserMenu, type NavSession } from "@/components/nav/UserMenu";
import { AwardPointsModal } from "@/components/points/AwardPointsModal";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { Category, EventItem, Team } from "@/lib/data/types";

type Pick = { id: string; name: string; teamName: string; teamColor: string; teamId: string; points: number };
type Ctx = { openAward: (prefill?: Pick | null) => void; openPalette: () => void };
const AdminCtx = createContext<Ctx>({ openAward: () => {}, openPalette: () => {} });
export const useAdmin = () => useContext(AdminCtx);

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/points", label: "Manage Points", icon: Trophy },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
const MOBILE_MAIN = NAV.slice(0, 4);
const MOBILE_MORE = NAV.slice(4);

const active = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

type Props = {
  session: NavSession;
  categories: Category[];
  events: EventItem[];
  teams: Team[];
  students: { id: string; name: string; teamName: string; teamColor: string; teamId: string; points: number }[];
  children: React.ReactNode;
};

export function AdminShell({ session, categories, events, teams, students, children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [awardOpen, setAwardOpen] = useState(false);
  const [prefill, setPrefill] = useState<Pick | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const openAward = useCallback((p?: Pick | null) => {
    setPrefill(p ?? null);
    setPaletteOpen(false);
    setAwardOpen(true);
  }, []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMoreOpen(false);
  }

  const go = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };
  const ctx = useMemo(() => ({ openAward, openPalette }), [openAward, openPalette]);

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
        {/* sidebar */}
        <aside className="hidden border-r border-line bg-bg-1/70 lg:block">
          <div className="sticky top-0 flex h-dvh flex-col p-4">
            <div className="px-2 py-3">
              <Logo href="/admin" />
              <p className="num mt-2 text-[10px] tracking-[0.3em] text-faint uppercase">Command center</p>
            </div>
            <nav aria-label="Admin" className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {NAV.map((n) => {
                const on = active(path, n.href);
                return (
                  <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={cn("relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", on ? "text-ink" : "text-dim hover:text-ink")}>
                    {on && <motion.span layoutId="admin-pill" transition={spring} className="absolute inset-0 rounded-md border border-line bg-surface-2" />}
                    <n.icon className="relative size-[18px]" aria-hidden />
                    <span className="relative flex-1">{n.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => openAward()} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-bg-0 shadow-[0_10px_30px_-10px_var(--accent)] hover:brightness-110">
              <Plus className="size-4" /> Award points
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-[var(--nav-h)] items-center gap-3 border-b border-line bg-bg-0/80 px-4 backdrop-blur-xl max-md:backdrop-blur-none sm:px-6">
            <div className="lg:hidden">
              <Logo href="/admin" />
            </div>
            <button onClick={openPalette} className="ml-auto flex h-11 min-w-0 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-faint hover:text-ink lg:ml-0 lg:w-80" aria-label="Open command palette">
              <Search className="size-4" aria-hidden />
              <span className="hidden flex-1 text-left sm:block">Search or run a command</span>
              <kbd className="num hidden items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10px] sm:flex">
                <CommandIcon className="size-3" />K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-2 max-lg:ml-0">
              <UserMenu session={session} />
            </div>
          </header>
          <main id="main" className="px-4 py-8 pb-[calc(var(--bottom-nav-h)+2.5rem)] sm:px-6 lg:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* mobile bottom nav */}
      <nav aria-label="Admin" className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-2xl border border-line-strong bg-bg-1/90 shadow-[0_20px_50px_-10px_rgb(0_0_0/0.8)] backdrop-blur-xl lg:hidden" style={{ height: "var(--bottom-nav-h)" }}>
        <ul className="grid h-full grid-cols-5 p-1.5">
          {MOBILE_MAIN.map((n) => {
            const on = active(path, n.href);
            return (
              <li key={n.href} className="relative">
                <Link href={n.href} aria-current={on ? "page" : undefined} className={cn("relative z-10 flex h-full min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium", on ? "text-ink" : "text-faint")}>
                  <n.icon className="size-5" aria-hidden />
                  {n.label.replace("Manage ", "")}
                </Link>
                {on && <motion.span layoutId="admin-bottom" transition={spring} className="absolute inset-0 rounded-xl bg-white/[0.08]" />}
              </li>
            );
          })}
          <li>
            <button onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className="flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium text-faint">
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
      {moreOpen && (
        <div className="fixed inset-x-3 bottom-[calc(var(--bottom-nav-h)+1.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-xl border border-line bg-bg-1 p-2 shadow-2xl lg:hidden">
          {MOBILE_MORE.map((n) => (
            <Link key={n.href} href={n.href} className="flex h-12 items-center gap-3 rounded-md px-3 text-sm active:bg-surface-2">
              <n.icon className="size-5 text-dim" aria-hidden /> {n.label}
            </Link>
          ))}
          <button onClick={() => openAward()} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-bg-0">
            <Plus className="size-4" /> Award points
          </button>
        </div>
      )}

      <Command.Dialog open={paletteOpen} onOpenChange={setPaletteOpen} label="Command palette" overlayClassName="fixed inset-0 z-[95] bg-black/70" contentClassName="glass fixed top-[12vh] left-1/2 z-[96] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl bg-bg-1 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-faint" aria-hidden />
          <Command.Input placeholder="Type a command or search students and teams..." className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
        </div>
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="p-6 text-center text-sm text-dim">No results.</Command.Empty>
          <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase">
            <Item icon={Plus} onSelect={() => openAward()}>Award Points</Item>
            <Item icon={CalendarPlus} onSelect={() => go("/admin/events?new=1")}>Create Event</Item>
            <Item icon={Trophy} onSelect={() => go("/leaderboard")}>View Leaderboard</Item>
            <Item icon={BarChart3} onSelect={() => go("/admin/analytics")}>View Analytics</Item>
          </Command.Group>
          <Command.Group heading="Teams" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase">
            {teams.map((t) => (
              <Item key={t.id} icon={Users} value={`team ${t.name}`} onSelect={() => go(`/teams/${t.slug}`)}>
                <span className="size-2 rounded-full" style={{ background: t.colorPrimary }} aria-hidden /> {t.name}
              </Item>
            ))}
          </Command.Group>
          <Command.Group heading="Students" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase">
            {students.map((s) => (
              <Item key={s.id} icon={UserSquare2} value={`student ${s.name} ${s.id} ${s.teamName}`} onSelect={() => go(`/students/${s.id}`)}>
                {s.name} <span className="num ml-auto text-xs text-faint">{s.id}</span>
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>

      <AwardPointsModal open={awardOpen} onClose={() => setAwardOpen(false)} categories={categories} events={events.filter((e) => e.status !== "upcoming")} teams={teams} prefillStudent={prefill} />
    </AdminCtx.Provider>
  );
}

function Item({ icon: Icon, children, onSelect, value }: { icon: LucideIcon; children: React.ReactNode; onSelect: () => void; value?: string }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-dim data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink">
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex flex-1 items-center gap-2">{children}</span>
    </Command.Item>
  );
}
