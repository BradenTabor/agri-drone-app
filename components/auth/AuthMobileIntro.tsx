import { BrandLogo } from "@/components/shared/BrandLogo";
import { BRAND } from "@/lib/brand";

export function AuthMobileIntro() {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/30 bg-black/25 px-3 py-2 backdrop-blur-md lg:hidden">
      <BrandLogo size="sm" display="overlay" tone="light" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight text-white">{BRAND.appName}</p>
        <p className="text-[0.65rem] tracking-[0.14em] text-white/80 uppercase">{BRAND.name}</p>
      </div>
    </div>
  );
}
