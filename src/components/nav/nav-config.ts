import { Award, CalendarDays, Info, LayoutGrid, Trophy, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const PRIMARY_NAV: NavItem[] = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/achievements", label: "Achievements", icon: Award },
];

export const MORE_NAV: NavItem[] = [{ href: "/about", label: "About", icon: Info }];

export const HOME: NavItem = { href: "/", label: "Home", icon: LayoutGrid };

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
