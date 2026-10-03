import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-1/60 max-md:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-10">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-faint">Every point counts.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dim">
          <Link href="/leaderboard" className="hover:text-ink">Leaderboard</Link>
          <Link href="/teams" className="hover:text-ink">Teams</Link>
          <Link href="/events" className="hover:text-ink">Events</Link>
          <Link href="/achievements" className="hover:text-ink">Achievements</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
        </nav>
      </div>
    </footer>
  );
}
