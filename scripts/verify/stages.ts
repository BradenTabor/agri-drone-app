import type { StageDefinition } from "./types";

/**
 * The ordered list of quality gates run by the verification loop.
 *
 * Order matters: static analysis is cheapest and runs first, the production
 * build runs before any e2e suite (the Playwright web server boots `next start`
 * against the built `.next` bundle), and authenticated e2e runs last because it
 * needs the most prerequisites.
 */
export const STAGES: StageDefinition[] = [
  {
    id: "lint",
    title: "ESLint",
    category: "static",
    command: "npm run lint",
    description: "Static analysis with the Next.js + TypeScript ESLint config.",
    blocking: true,
    deterministic: true,
  },
  {
    id: "typecheck",
    title: "TypeScript typecheck",
    category: "static",
    command: "npm run typecheck",
    description: "`tsc --noEmit` across the whole project.",
    blocking: true,
    deterministic: true,
  },
  {
    id: "unit",
    title: "Unit tests",
    category: "unit",
    command: "npm run test:unit",
    description: "node:test unit suites under e2e/lib for pure logic.",
    blocking: true,
    deterministic: true,
  },
  {
    id: "build",
    title: "Production build",
    category: "build",
    command: "npm run build",
    description: "Next.js production build (inlines NEXT_PUBLIC_* at build time).",
    blocking: true,
    requiredEnv: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    deterministic: true,
  },
  {
    id: "e2e-perimeter",
    title: "Perimeter smoke (public + auth guards)",
    category: "e2e",
    command: "npm run test:smoke:perimeter",
    description:
      "Playwright public-auth + auth-guard specs against a non-prod Supabase project.",
    blocking: true,
    requiredEnv: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    needsBuild: true,
    requiresBrowsers: true,
    deterministic: false,
  },
  {
    id: "e2e-authenticated",
    title: "Authenticated smoke (dedicated E2E project)",
    category: "e2e",
    command: "npm run test:smoke:authenticated",
    description:
      "Playwright authenticated navigation + record write flows against the dedicated E2E project.",
    // Gated on a dedicated E2E project + disposable credentials; not part of the
    // default production-ready gate so missing secrets do not fail the loop.
    blocking: false,
    requiredEnv: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "E2E_EMAIL",
      "E2E_PASSWORD",
    ],
    needsBuild: true,
    requiresBrowsers: true,
    deterministic: false,
  },
];

export function findStage(id: string): StageDefinition | undefined {
  return STAGES.find((stage) => stage.id === id);
}
