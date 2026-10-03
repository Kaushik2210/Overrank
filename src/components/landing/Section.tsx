import { SplitText } from "@/components/fx/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tint?: boolean;
};

/** Landing page section with its own scroll-triggered heading. */
export function Section({ id, eyebrow, title, description, action, children, className, tint }: Props) {
  return (
    <section id={id} className={cn("relative py-16 sm:py-24", tint && "border-y border-line bg-bg-1/70", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="num text-xs tracking-[0.28em] text-accent uppercase">{eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-bold sm:text-5xl"><SplitText text={title} /></h2>
            {description && <p className="mt-3 text-dim">{description}</p>}
          </div>
          {action}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
