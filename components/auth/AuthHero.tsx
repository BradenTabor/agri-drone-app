import { BrandLogo } from "@/components/shared/BrandLogo";
import { BRAND } from "@/lib/brand";

const STAT_CHIPS = [
  "Mix record capture",
  "PDF export ready",
  "Ozark foothills, AR",
] as const;

export function AuthHero() {
  return (
    <section
      aria-hidden
      className="relative hidden min-h-dvh flex-col justify-between px-8 py-10 lg:flex xl:px-12 xl:py-12"
    >
      <div className="animate-auth-rise flex items-center gap-3 rounded-2xl border border-white/30 bg-black/30 px-3 py-2 backdrop-blur-md">
        <BrandLogo size="sm" display="overlay" tone="light" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">{BRAND.appName}</p>
          <p className="text-[0.65rem] tracking-[0.14em] text-white/80 uppercase">{BRAND.name}</p>
        </div>
      </div>

      <div className="max-w-xl space-y-6 pb-6">
        <p className="font-mono text-[0.65rem] tracking-[0.2em] text-auth-accent-on-dark uppercase">
          {BRAND.tagline}
        </p>
        <h2 className="font-heading text-[clamp(2.25rem,3.6vw,3.35rem)] leading-[1.05] font-semibold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(15,23,42,0.35)]">
          Every application,
          <span className="block text-auth-accent-on-dark drop-shadow-[0_2px_14px_rgba(15,23,42,0.5)]">
            on record.
          </span>
        </h2>
        <p className="max-w-md text-base leading-relaxed text-white/90 drop-shadow-[0_1px_10px_rgba(15,23,42,0.28)]">
          Log mix sheets, customers, and equipment from the field — then pull PDF-ready records
          when the job is done.
        </p>
        <ul className="flex flex-wrap gap-2.5">
          {STAT_CHIPS.map((chip, index) => (
            <li
              key={chip}
              className="animate-auth-rise rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-xs font-medium tracking-wide text-white/95 backdrop-blur-sm"
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
