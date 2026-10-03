"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { MORE_NAV, PRIMARY_NAV, isActive } from "./nav-config";
import { UserMenu, type NavSession } from "./UserMenu";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/**
 * Top bar. Full link row from lg up; on tablet the links collapse into a menu panel.
 * Phones get the floating bottom nav instead, so the top bar stays minimal there.
 */
export function Navbar({ session, bell }: { session: NavSession; bell?: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [...PRIMARY_NAV, ...MORE_NAV];

  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg-0/70 backdrop-blur-xl max-md:backdrop-blur-none max-md:bg-bg-0/90">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Logo />
        </motion.div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => {
              const active = isActive(path, l.href);
              return (
                <li key={l.href} className="relative">
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("relative z-10 inline-flex h-11 items-center rounded-md px-4 text-sm font-medium transition-colors", active ? "text-ink" : "text-dim hover:text-ink")}
                  >
                    {l.label}
                  </Link>
                  {active && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-md border border-line bg-surface-2" />}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {bell}
          <UserMenu session={session} />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="tablet-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="hidden size-11 place-items-center rounded-md border border-line text-dim hover:text-ink md:grid lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="tablet-nav"
            aria-label="Menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            className="hidden border-t border-line bg-bg-1 md:block lg:hidden"
          >
            <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-2 p-4 sm:px-6">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={cn("flex h-12 items-center gap-3 rounded-md px-4 text-sm font-medium", isActive(path, l.href) ? "bg-surface-2 text-ink" : "text-dim hover:bg-surface")}>
                    <l.icon className="size-4" aria-hidden /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
