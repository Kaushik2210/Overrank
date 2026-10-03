import { Compass } from "lucide-react";
import { GridBackground } from "@/components/background/GridBackground";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 text-center">
      <GridBackground />
      <div className="relative">
        <Compass className="mx-auto size-10 text-accent" aria-hidden />
        <p className="num mt-6 text-sm tracking-[0.3em] text-faint">ERROR 404</p>
        <h1 className="mt-2 font-display text-5xl font-bold sm:text-7xl">PAGE NOT FOUND</h1>
        <p className="mt-4 text-lg text-dim">Looks like this timeline doesn&apos;t exist.</p>
        <div className="mt-8">
          <Button href="/" size="lg">
            RETURN TO COMMAND CENTER
          </Button>
        </div>
      </div>
    </main>
  );
}
