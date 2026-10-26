import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

const DOTS: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgb(255 255 255 / 0.18) 1.5px, transparent 1.5px)",
  backgroundSize: "22px 22px",
};

export function PageBanner({
  title,
  subtitle,
  icon: Icon,
  back,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      <div aria-hidden className="absolute inset-0 -z-10" style={DOTS} />
      {/* Oversized tilted icon as a backdrop motif */}
      <Icon
        aria-hidden
        className="anim-float absolute -right-6 -bottom-10 -z-10 size-52 text-white/10 sm:right-10"
        style={{ "--r": "-12deg", "--dur": "8s" } as React.CSSProperties}
        strokeWidth={1.5}
      />

      <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-8 sm:pb-12">
        {back ? (
          <Link
            href={back.href}
            className="anim-pop group inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
            {back.label}
          </Link>
        ) : null}
        <div className="anim-pop mt-5 flex items-center gap-4" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="flex size-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_4px_0_0_var(--primary-deep)]">
            <Icon className="size-7" strokeWidth={2.5} />
          </div>
          <h1 className="min-w-0 text-balance font-heading text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
        </div>
        {subtitle ? (
          <div
            className="anim-pop mt-4 max-w-xl text-base font-semibold text-white/85"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {subtitle}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
