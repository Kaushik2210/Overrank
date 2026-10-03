import {
  Award, CalendarCheck, Code2, Crown, FileCheck, Flame, GraduationCap, Hand, Heart, HeartHandshake, Layers,
  Lock, Medal, PartyPopper, Rocket, Shapes, Shield, Sparkles, Star, Swords, Target, Trophy, Users, Zap,
  type LucideIcon,
} from "lucide-react";

/** Only the icons categories and achievements reference, so we don't bundle the whole set. */
export const ICONS: Record<string, LucideIcon> = {
  Award, CalendarCheck, Code2, Crown, FileCheck, Flame, GraduationCap, Hand, Heart, HeartHandshake, Layers,
  Medal, PartyPopper, Rocket, Shapes, Shield, Sparkles, Star, Swords, Target, Trophy, Users, Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Award;
  return <C className={className} aria-hidden />;
}

export { Lock };
