"use client";

import { Download, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Select } from "@/components/ui/Field";
import type { Category, Team } from "@/lib/data/types";

/** Filters live in the URL so the table stays server-rendered, shareable and back-button friendly. */
export function LedgerToolbar({ teams, categories }: { teams: Team[]; categories: Category[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("page");
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    const t = window.setTimeout(() => (q !== (sp.get("q") ?? "") ? set("q", q) : undefined), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const csv = `/api/admin/ledger?${sp.toString()}`;

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search ledger" placeholder="Search student, reason..." className="h-11 w-full rounded-md border border-line bg-bg-2/80 pr-3 pl-10 text-sm placeholder:text-faint focus:border-accent focus:outline-none" />
      </div>
      <Select aria-label="Team" value={sp.get("team") ?? ""} onChange={(e) => set("team", e.target.value)} className="lg:w-44">
        <option value="">All teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Category" value={sp.get("category") ?? ""} onChange={(e) => set("category", e.target.value)} className="lg:w-44">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Status" value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)} className="lg:w-36">
        <option value="">Any status</option>
        <option value="active">Active</option>
        <option value="reversed">Reversed</option>
        <option value="pending">Pending</option>
      </Select>
      <a href={csv} className="flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong px-4 text-sm font-medium hover:bg-surface-2 lg:ml-auto">
        <Download className="size-4" aria-hidden /> Export CSV
      </a>
    </div>
  );
}
