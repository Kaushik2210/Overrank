"use client";

import { AlertTriangle } from "lucide-react";
import { GridBackground } from "@/components/background/GridBackground";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 text-center">
      <GridBackground glow="#ef4444" />
      <div className="relative max-w-md">
        <AlertTriangle className="mx-auto size-10 text-danger" aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold">SIGNAL LOST</h1>
        <p className="mt-3 text-dim">Something broke on our side. Your points are safe. Try again in a moment.</p>
        {error.digest && <p className="num mt-3 text-xs text-faint">Ref {error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>RETRY</Button>
          <Button href="/" variant="outline">
            HOME
          </Button>
        </div>
      </div>
    </main>
  );
}
