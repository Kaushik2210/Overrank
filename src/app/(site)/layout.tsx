import { Footer } from "@/components/nav/Footer";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { Navbar } from "@/components/nav/Navbar";
import { getNavSession } from "@/lib/nav-session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getNavSession();
  return (
    <div className="relative min-h-dvh">
      <a href="#main" className="sr-only z-[200] rounded bg-accent px-4 py-2 font-semibold text-bg-0 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Navbar session={session} />
      <main id="main" className="pb-[calc(var(--bottom-nav-h)+2rem)] md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav role={session?.role ?? null} />
    </div>
  );
}
