import type { CSSProperties } from "react";

/** Injects a team's colours as CSS variables; everything inside can use `--team-primary` / `--team-glow`. */
export function teamVars(t: { colorPrimary: string; colorGlow: string }): CSSProperties {
  return { "--team-primary": t.colorPrimary, "--team-glow": t.colorGlow } as CSSProperties;
}
