import { cn } from "@/lib/utils";

/** Endless horizontal ticker. Pure CSS (transform only), pauses on hover, static under reduced motion. */
export function Marquee({ children, className, speed = 40 }: { children: React.ReactNode; className?: string; speed?: number }) {
  return (
    <div className={cn("group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]", className)}>
      <div className="marquee-track flex shrink-0 items-center gap-8 pr-8 group-hover:[animation-play-state:paused]" style={{ animationDuration: `${speed}s` }}>
        {children}
      </div>
      <div aria-hidden className="marquee-track flex shrink-0 items-center gap-8 pr-8 group-hover:[animation-play-state:paused]" style={{ animationDuration: `${speed}s` }}>
        {children}
      </div>
    </div>
  );
}
