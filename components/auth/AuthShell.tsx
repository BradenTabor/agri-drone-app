import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthGlassPanel } from "@/components/auth/AuthGlassPanel";
import { AuthHero } from "@/components/auth/AuthHero";
import { AuthMobileIntro } from "@/components/auth/AuthMobileIntro";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden text-foreground">
      <AuthBackground />

      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AuthHero />

        <div className="flex flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:justify-center lg:px-10 lg:py-10 xl:px-14">
          <AuthMobileIntro />
          <AuthGlassPanel className="max-w-md lg:max-w-lg">{children}</AuthGlassPanel>
        </div>
      </div>
    </main>
  );
}
