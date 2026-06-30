import { BrandLogo } from "@/components/shared/BrandLogo";
import { BRAND } from "@/lib/brand";

export function AuthMobileIntro() {
  return (
    <div className="mb-3 space-y-2.5 lg:hidden">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/30 bg-black/25 px-3 py-2 backdrop-blur-md">
        <BrandLogo size="sm" display="overlay" tone="light" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">{BRAND.appName}</p>
          <p className="text-[0.65rem] tracking-[0.14em] text-white/80 uppercase">{BRAND.name}</p>
        </div>
      </div>
      <p className="font-heading text-base font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(15,23,42,0.45)] sm:text-lg">
        Every application,{" "}
        <span className="text-auth-accent-on-dark drop-shadow-[0_2px_12px_rgba(15,23,42,0.45)]">on record.</span>
      </p>
      <p className="text-sm leading-snug text-white/88 drop-shadow-[0_1px_8px_rgba(15,23,42,0.35)]">
        Log mix sheets, customers, and equipment from the field.
      </p>
    </div>
  );
}
