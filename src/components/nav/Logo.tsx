import Link from "next/link";
import { cn } from "@/lib/utils";

/** OVERRANK mark: two chevrons climbing through a hexagon, the upper one breaking out of the top edge. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className={className}>
      <path d="M20 2 36 11v18L20 38 4 29V11z" fill="none" stroke="#d4ff3a" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11.5 27 20 18.5 28.5 27" fill="none" stroke="#d4ff3a" strokeOpacity=".5" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 20 20 11.5 28.5 20" fill="none" stroke="#d4ff3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="OVERRANK home" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.05rem] font-bold tracking-[0.14em]">
        OVER<span className="text-accent">RANK</span>
      </span>
    </Link>
  );
}
