import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-1/60 max-md:pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="mx-auto hidden max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-10 md:flex">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-faint">Outrank everyone. Every point counts.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dim">
          <Link href="/leaderboard" className="hover:text-ink">Leaderboard</Link>
          <Link href="/teams" className="hover:text-ink">Teams</Link>
          <Link href="/events" className="hover:text-ink">Events</Link>
          <Link href="/achievements" className="hover:text-ink">Achievements</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-6 py-4 text-center text-sm text-faint md:text-left">
          Built by <span className="font-semibold text-ink">S V Kaushik</span>
        </p>
      </div>
    </footer>
  );
}
