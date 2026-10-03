import { NotificationCenter } from "@/components/feedback/NotificationCenter";
import { Footer } from "@/components/nav/Footer";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { Navbar } from "@/components/nav/Navbar";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { getNavSession } from "@/lib/nav-session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [nav, raw] = await Promise.all([getNavSession(), getSession()]);
  const notes = raw ? await getRepo().listNotifications(raw.userId) : [];
  return (
    <div className="relative min-h-dvh">
      <a href="#main" className="sr-only z-[200] rounded bg-accent px-4 py-2 font-semibold text-bg-0 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Navbar session={nav} bell={raw ? <NotificationCenter initial={notes} userId={raw.userId} /> : null} />
      <main id="main" className="pb-[calc(var(--bottom-nav-h)+2rem)] md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav role={nav?.role ?? null} />
    </div>
  );
}
