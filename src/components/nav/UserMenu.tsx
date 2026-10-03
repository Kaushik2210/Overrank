"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LogIn, LogOut, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/actions/auth";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { Button } from "@/components/ui/Button";
import { spring } from "@/lib/motion";

export type NavSession = { name: string; role: "student" | "teacher" | "admin"; color?: string; glow?: string } | null;

export function UserMenu({ session }: { session: NavSession }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!session) {
    return (
      <Button href="/login" size="sm" variant="outline">
        <LogIn className="size-4" /> Faculty login
      </Button>
    );
  }

  const items = [
    { href: "/admin", label: "Command center", icon: ShieldCheck },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-1.5 transition-colors hover:bg-surface-2"
      >
        <StudentAvatar name={session.name} color={session.color ?? "#6366f1"} glow={session.glow} size={32} />
        <ChevronDown className="size-4 text-dim max-sm:hidden" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={spring}
            className="glass absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-lg bg-bg-1 p-1.5"
          >
            <div className="border-b border-line px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p className="text-xs text-faint capitalize">{session.role}</p>
            </div>
            <div className="py-1.5">
              {items.map((it) => (
                <Link key={it.href} href={it.href} role="menuitem" onClick={() => setOpen(false)} className="flex h-11 items-center gap-3 rounded-md px-3 text-sm text-dim hover:bg-surface-2 hover:text-ink">
                  <it.icon className="size-4" aria-hidden /> {it.label}
                </Link>
              ))}
            </div>
            <form action={signOutAction} className="border-t border-line pt-1.5">
              <button role="menuitem" className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-dim hover:bg-surface-2 hover:text-danger">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
