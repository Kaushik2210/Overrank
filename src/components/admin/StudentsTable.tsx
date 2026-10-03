"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdmin } from "./AdminShell";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { Select } from "@/components/ui/Field";
import { cn, formatPoints } from "@/lib/utils";
import type { StudentStanding, Team } from "@/lib/data/types";

type SortKey = "rank" | "name" | "points";

export function StudentsTable({ students, teams }: { students: StudentStanding[]; teams: Team[] }) {
  const { openAward } = useAdmin();
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return students
      .filter((s) => (!team || s.teamId === team) && (!n || s.name.toLowerCase().includes(n) || s.id.includes(n)))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "points" ? b.points - a.points : a.rank - b.rank || a.name.localeCompare(b.name)));
  }, [students, q, team, sort]);

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" placeholder="Search name or student ID" className="h-11 w-full rounded-md border border-line bg-bg-2/80 pr-3 pl-10 text-sm placeholder:text-faint focus:border-accent focus:outline-none" />
        </div>
        <Select aria-label="Team" value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="rank">Sort by rank</option>
          <option value="points">Sort by points</option>
          <option value="name">Sort by name</option>
        </Select>
      </div>

      <p className="num mb-3 text-xs text-faint">{rows.length} students</p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <li key={s.id} className="glass flex items-center gap-3 rounded-lg p-3.5">
            <StudentAvatar name={s.name} color={s.teamColor} glow={s.teamGlow} size={44} />
            <Link href={`/students/${s.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium hover:text-accent">{s.name}</p>
              <p className="num truncate text-xs text-faint">
                {s.id} · <span style={{ color: s.teamColor }}>{s.teamName}</span>
              </p>
            </Link>
            <div className="text-right">
              <p className={cn("num text-lg font-semibold", s.points < 0 && "text-danger")}>{formatPoints(s.points)}</p>
              <p className="num text-[10px] text-faint">Lv {s.level} · #{s.rank}</p>
            </div>
            <button
              onClick={() => openAward({ id: s.id, name: s.name, teamName: s.teamName, teamColor: s.teamColor, teamId: s.teamId, points: s.points })}
              aria-label={`Award points to ${s.name}`}
              className="grid size-11 shrink-0 place-items-center rounded-md border border-line text-dim hover:border-accent hover:text-accent"
            >
              <Plus className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
