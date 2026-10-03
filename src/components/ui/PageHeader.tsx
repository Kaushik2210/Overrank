import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        <p className="num text-xs tracking-[0.28em] text-accent uppercase">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-base text-dim sm:text-lg">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
