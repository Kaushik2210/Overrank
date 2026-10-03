import { cn, initials } from "@/lib/utils";

type Props = {
  name: string;
  color?: string;
  glow?: string;
  size?: number;
  className?: string;
};

/** Monogram avatar ringed in the team colour. No image dependency. */
export function StudentAvatar({ name, color = "#6366f1", glow, size = 40, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `radial-gradient(circle at 30% 25%, ${glow ?? color}, ${color} 70%)`,
        boxShadow: `0 0 0 2px var(--bg-0), 0 0 0 3px ${color}`,
      }}
    >
      {initials(name)}
    </span>
  );
}
