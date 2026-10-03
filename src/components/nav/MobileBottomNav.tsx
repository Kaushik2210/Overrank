"use client";

import { AnimatePresence, motion } from "motion/react";
import { Info, LogOut, MoreHorizontal, Settings, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV, isActive } from "./nav-config";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

type Props = { role: "student" | "teacher" | "admin" | null };

/** Floating, thumb-reachable nav for phones. Hidden from md up. */
export function MobileBottomNav({ role }: Props) {
  const path = usePathname();
  const [more, setMore] = useState(false);

  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMore(false);
  }

  const moreItems = [
    { href: "/about", label: "About", icon: Info },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(role ? [{ href: "/admin", label: "Command center", icon: ShieldCheck }] : []),
  ];
  const moreActive = moreItems.some((m) => isActive(path, m.href));

  return (
    <>
      <AnimatePresence>
        {more && (
          <>
            <motion.button
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMore(false)}
            />
            <motion.div
              role="dialog"
              aria-label="More"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0, transition: { duration: 0.15 } }}
              transition={spring}
              className="fixed inset-x-3 bottom-[calc(var(--bottom-nav-h)+0.75rem+env(safe-area-inset-bottom))] z-50 rounded-xl border border-line bg-bg-1 p-2 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium tracking-wider text-faint uppercase">More</span>
                <button onClick={() => setMore(false)} aria-label="Close" className="-m-2 grid size-11 place-items-center text-dim">
                  <X className="size-4" />
                </button>
              </div>
              <ul>
                {moreItems.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} className="flex h-12 items-center gap-3 rounded-md px-3 text-sm text-ink/90 active:bg-surface-2">
                      <m.icon className="size-5 text-dim" aria-hidden /> {m.label}
                    </Link>
                  </li>
                ))}
                {role && (
                  <li>
                    <form action={signOutAction}>
                      <button className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-sm text-danger active:bg-surface-2">
                        <LogOut className="size-5" aria-hidden /> Sign out
                      </button>
                    </form>
                  </li>
                )}
                {!role && (
                  <li>
                    <Link href="/login" className="flex h-12 items-center gap-3 rounded-md px-3 text-sm text-accent">
                      Faculty login
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-line-strong bg-bg-1/85 shadow-[0_20px_50px_-10px_rgb(0_0_0/0.8)] backdrop-blur-xl md:hidden"
        style={{ height: "var(--bottom-nav-h)" }}
      >
        <ul className="grid h-full grid-cols-5 items-stretch p-1.5">
          {PRIMARY_NAV.map((l) => {
            const active = isActive(path, l.href);
            return (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative z-10 flex h-full min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors", active ? "text-ink" : "text-faint")}
                >
                  <l.icon className="size-5" aria-hidden />
                  {l.label === "Achievements" ? "Badges" : l.label}
                </Link>
                {active && <motion.span layoutId="bottom-pill" transition={spring} className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-[0_0_20px_-4px_var(--accent)]" />}
              </li>
            );
          })}
          <li className="relative">
            <button
              onClick={() => setMore((m) => !m)}
              aria-expanded={more}
              className={cn("relative z-10 flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium", more || moreActive ? "text-ink" : "text-faint")}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
            {(more || moreActive) && !PRIMARY_NAV.some((l) => isActive(path, l.href)) && (
              <motion.span layoutId="bottom-pill" transition={spring} className="absolute inset-0 rounded-xl bg-white/[0.08]" />
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}
