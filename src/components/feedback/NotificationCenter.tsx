"use client";

import { AnimatePresence, motion } from "motion/react";
import { Award, Bell, CalendarDays, CheckCheck, ClipboardCheck, Info, TrendingUp, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { dismissNotificationAction, listNotificationsAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { cn, timeAgo } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { Notification } from "@/lib/data/types";

const ICON = { points: Trophy, rank: TrendingUp, achievement: Award, event: CalendarDays, review: ClipboardCheck, system: Info };
const realtime = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function NotificationCenter({ initial, userId }: { initial: Notification[]; userId: string }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  const refresh = useCallback(async () => {
    const r = await listNotificationsAction();
    if (r.ok) setItems(r.data);
  }, []);

  useEffect(() => {
    if (realtime) {
      let cleanup = () => {};
      import("@/lib/supabase/client").then(({ createClient }) => {
        const sb = createClient();
        const ch = sb.channel(`notifications-${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, refresh).subscribe();
        cleanup = () => void sb.removeChannel(ch);
      });
      return () => cleanup();
    }
    const id = window.setInterval(() => !document.hidden && refresh(), 15000);
    return () => window.clearInterval(id);
  }, [refresh, userId]);

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

  const read = (id: string) => {
    setItems((l) => l.map((n) => (id === "all" || n.id === id ? { ...n, read: true } : n)));
    void markNotificationReadAction(id);
  };
  const dismiss = (id: string) => {
    setItems((l) => l.filter((n) => n.id !== id));
    void dismissNotificationAction(id);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative grid size-11 place-items-center rounded-full border border-line bg-surface text-dim transition-colors hover:text-ink">
        <Bell className="size-[18px]" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="num absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg-0">
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }} transition={spring} className="glass fixed inset-x-3 top-[calc(var(--nav-h)+0.5rem)] z-50 origin-top-right rounded-xl bg-bg-1 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Notifications</h2>
              {unread > 0 && (
                <button onClick={() => read("all")} className="flex h-9 items-center gap-1.5 text-xs text-accent hover:underline">
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              <AnimatePresence initial={false}>
                {items.map((n) => {
                  const Icon = ICON[n.kind];
                  return (
                    <motion.li key={n.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, x: 60, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <div className={cn("flex items-start gap-3 rounded-lg p-3", !n.read && "bg-accent/[0.06]")}>
                        <Icon className={cn("mt-0.5 size-4 shrink-0", n.read ? "text-faint" : "text-accent")} aria-hidden />
                        <button onClick={() => read(n.id)} className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-sm text-dim">{n.body}</p>
                          <p className="num mt-1 text-[11px] text-faint">{timeAgo(n.createdAt)}</p>
                        </button>
                        <button onClick={() => dismiss(n.id)} aria-label={`Dismiss ${n.title}`} className="-m-1.5 grid size-11 shrink-0 place-items-center rounded text-faint hover:text-ink">
                          <X className="size-4" />
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {items.length === 0 && <li className="p-8 text-center text-sm text-dim">You are all caught up.</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
