import type { Finding, StageDefinition } from "./types";

interface Signature {
  name: string;
  /** Pattern matched against combined stdout/stderr. */
  test: RegExp;
  /** Categories this signature applies to (empty = any). */
  categories?: StageDefinition["category"][];
  detail: (match: RegExpMatchArray, output: string) => string;
  remediation: string;
  priority: number;
}

/** Extract up to `limit` distinct file paths referenced in tool output. */
function extractFiles(output: string, limit = 8): string[] {
  const files = new Set<string>();
  // Matches paths like app/(app)/page.tsx, lib/foo/bar.ts, e2e/lib/x.test.ts
  const fileRe =
    /(?:^|\s|\()((?:\.\/)?(?:app|lib|components|e2e|scripts|types)\/[\w()[\]@.\-/]+\.(?:tsx?|mjs|css))(?::\d+:\d+)?/gm;
  let match: RegExpExecArray | null;
  while ((match = fileRe.exec(output)) !== null) {
    const file = match[1]?.replace(/^\.\//, "");
    if (file) {
      files.add(file);
    }
    if (files.size >= limit) {
      break;
    }
  }
  return [...files];
}

/**
 * Ordered most-specific-first. The analyzer returns every matching signature so
 * the remediation plan captures the full picture rather than the first error.
 */
const SIGNATURES: Signature[] = [
  {
    name: "missing-supabase-env",
    test: /Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    detail: () =>
      "Supabase public env vars are missing at build/runtime; the bundle cannot init auth.",
    remediation:
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (non-prod) before running the loop. Copy .env.e2e.example to .env.e2e.local or export them.",
    priority: 1,
  },
  {
    name: "playwright-browser-missing",
    test: /Executable doesn'?t exist|playwright install/i,
    categories: ["e2e"],
    detail: () => "Playwright browser binary is not installed.",
    remediation: "Run `npx playwright install --with-deps chromium`.",
    priority: 1,
  },
  {
    name: "e2e-webserver-start-failed",
    test: /(Process from config\.webServer was not able to start|Exit code: 127|exec: npm: not found|npm: not found|command not found)/,
    categories: ["e2e"],
    detail: () =>
      "The Playwright web server command failed to start (PATH / command error, e.g. `npm` not found in the `bash -lc` login shell).",
    remediation:
      "Ensure node/npm are on PATH for login shells. With nvm, run `unset npm_config_prefix` before the loop. Confirm `npm run start -- -p 3002` works standalone.",
    priority: 1,
  },
  {
    name: "e2e-server-unreachable",
    test: /(ECONNREFUSED|net::ERR_|Timed out waiting \d+ms from config\.webServer)/,
    categories: ["e2e"],
    detail: () =>
      "The Playwright web server or Supabase endpoint was unreachable (likely missing build, wrong port, or invalid anon key).",
    remediation:
      "Confirm the production build succeeded, the dev server port is free, and NEXT_PUBLIC_SUPABASE_* point at a reachable non-prod project.",
    priority: 2,
  },
  {
    name: "typescript-type-error",
    test: /error TS\d+:/,
    detail: (_m, output) => {
      const count = (output.match(/error TS\d+:/g) ?? []).length;
      return `${count} TypeScript type error(s) reported by tsc.`;
    },
    remediation:
      "Fix the reported type errors. Do not use `any`; prefer generated Convex/DB types and proper validators.",
    priority: 3,
  },
  {
    name: "module-not-found",
    test: /Module not found|Cannot find module/,
    detail: () => "An import points at a module that cannot be resolved.",
    remediation:
      "Fix the import path/alias (paths use the `@/` root alias) or install the missing dependency.",
    priority: 2,
  },
  {
    name: "eslint-errors",
    test: /\b(\d+) problems? \((\d+) errors?/,
    categories: ["static"],
    detail: (match) => `ESLint reported ${match[2]} error(s).`,
    remediation:
      "Resolve the ESLint errors (run `npm run lint` for the full list). Many are auto-fixable with `eslint --fix`.",
    priority: 3,
  },
  {
    name: "next-compile-failed",
    test: /Failed to compile/,
    categories: ["build"],
    detail: () => "The Next.js production build failed to compile.",
    remediation:
      "Read the compile error above the summary and fix the offending file (often a type error or invalid import in a route/component).",
    priority: 2,
  },
  {
    name: "unit-test-failure",
    test: /# fail (\d+)/,
    categories: ["unit"],
    detail: (match) => `${match[1]} unit test(s) failed.`,
    remediation:
      "Inspect the failing assertions. Decide whether the test or the implementation is wrong, then fix the source of truth.",
    priority: 3,
  },
  {
    name: "playwright-test-failure",
    test: /\b(\d+) failed\b/,
    categories: ["e2e"],
    detail: (match) => `${match[1]} Playwright test(s) failed.`,
    remediation:
      "Open playwright-report/index.html (or the trace) to see the failing assertion and fix the UI/route or the spec selector.",
    priority: 4,
  },
];

/**
 * Analyze a failed stage's output and return findings (remediation hints).
 * Always returns at least one generic finding so the plan is never empty for a
 * failure the signature table did not recognize.
 */
export function analyzeFailure(
  stage: StageDefinition,
  output: string,
): Finding[] {
  const findings: Finding[] = [];
  const files = extractFiles(output);

  for (const signature of SIGNATURES) {
    if (signature.categories && !signature.categories.includes(stage.category)) {
      continue;
    }
    const match = output.match(signature.test);
    if (!match) {
      continue;
    }
    findings.push({
      stageId: stage.id,
      signature: signature.name,
      detail: signature.detail(match, output),
      remediation: signature.remediation,
      files,
      priority: signature.priority,
    });
  }

  if (findings.length === 0) {
    findings.push({
      stageId: stage.id,
      signature: "unrecognized-failure",
      detail: `Stage "${stage.id}" failed but no known signature matched. Inspect the output tail.`,
      remediation: `Run \`${stage.command}\` directly and read the full output to diagnose.`,
      files,
      priority: 5,
    });
  }

  return findings;
}

/** Build an ordered, de-duplicated remediation plan from all findings. */
export function buildPlan(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const unique: Finding[] = [];
  for (const finding of findings) {
    const key = `${finding.stageId}:${finding.signature}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }
  return unique.sort((a, b) => a.priority - b.priority);
}
