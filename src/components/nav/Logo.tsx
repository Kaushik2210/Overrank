import Link from "next/link";
import { cn } from "@/lib/utils";

/** HOUSECORE mark: a hexagon with an ascending chevron and a single point above it. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className={className}>
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4ff3a" />
          <stop offset="1" stopColor="#f5ff9e" />
        </linearGradient>
      </defs>
      <path d="M20 2 36 11v18L20 38 4 29V11z" fill="none" stroke="url(#lm)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12.5 25 20 18l7.5 7" fill="none" stroke="url(#lm)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="11.5" r="2.2" fill="#d4ff3a" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="HOUSECORE home" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.05rem] font-bold tracking-[0.14em]">
        HOUSE<span className="text-accent">CORE</span>
      </span>
    </Link>
  );
}
