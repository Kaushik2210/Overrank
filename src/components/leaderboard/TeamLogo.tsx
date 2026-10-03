import { cn } from "@/lib/utils";

type Props = {
  name: string;
  slug: string;
  color: string;
  glow: string;
  size?: number;
  className?: string;
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function monogram(name: string) {
  const words = name.replace(/[_-]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
}

/**
 * Generated emblem: hex shield, team gradient, one of six inner marks picked from the slug.
 * Pure SVG so it scales crisply and recolours when an admin changes the team colour.
 */
export function TeamLogo({ name, slug, color, glow, size = 56, className }: Props) {
  const variant = hash(slug) % 6;
  const id = `tl-${slug}`;
  const marks = [
    <path key="0" d="M20 44 32 32 44 44M20 36 32 24 44 36" fill="none" stroke="rgb(255 255 255/.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />,
    <path key="1" d="M35 18 24 36h8l-3 12 12-20h-8z" fill="rgb(255 255 255/.5)" />,
    <g key="2" fill="none" stroke="rgb(255 255 255/.5)" strokeWidth="2.5">
      <circle cx="32" cy="32" r="14" />
      <circle cx="32" cy="32" r="7" />
    </g>,
    <path key="3" d="M32 17 47 32 32 47 17 32z" fill="none" stroke="rgb(255 255 255/.55)" strokeWidth="2.5" strokeLinejoin="round" />,
    <path key="4" d="M32 18 44 25v14L32 46 20 39V25z" fill="none" stroke="rgb(255 255 255/.55)" strokeWidth="2.5" strokeLinejoin="round" />,
    <path key="5" d="M20 46 44 18M26 48 48 22" stroke="rgb(255 255 255/.5)" strokeWidth="2.5" strokeLinecap="round" />,
  ];
  return (
    <svg
      role="img"
      aria-label={`${name} emblem`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill={`url(#${id})`} />
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="none" stroke="rgb(255 255 255/.35)" strokeWidth="1.5" />
      <path d="M32 3 57 17.5 32 32 7 17.5z" fill="rgb(255 255 255/.12)" />
      {marks[variant]}
      <text x="32" y="55.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" style={{ fontFamily: "var(--font-space-grotesk), sans-serif", letterSpacing: "0.04em" }}>
        {monogram(name)}
      </text>
    </svg>
  );
}
