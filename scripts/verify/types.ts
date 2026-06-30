/**
 * Shared types for the autonomous verification loop.
 *
 * The verification loop runs every quality gate in the project (lint, typecheck,
 * unit tests, production build, and Playwright smoke suites), analyzes the
 * results, and emits a machine-readable report plus a prioritized remediation
 * plan. See docs/AUTONOMOUS_VERIFICATION_LOOP.md for the full workflow.
 */

export type StageCategory = "static" | "unit" | "build" | "e2e";

export type StageStatus = "passed" | "failed" | "skipped";

/** A single quality gate the loop knows how to run. */
export interface StageDefinition {
  /** Stable identifier (used in reports, history, and `--only` filters). */
  id: string;
  /** Human-readable title shown in summaries. */
  title: string;
  category: StageCategory;
  /** Shell command executed for this stage. */
  command: string;
  /** One-line description of what the stage verifies. */
  description: string;
  /**
   * Whether a failure (or unmet prerequisite) blocks "production ready".
   * Non-blocking stages still run, but a skip/failure does not fail the gate.
   */
  blocking: boolean;
  /** Env vars that must be set (and non-empty) or the stage is skipped. */
  requiredEnv?: string[];
  /** Stage needs a successful production build to have run first. */
  needsBuild?: boolean;
  /** Stage needs Playwright browsers installed. */
  requiresBrowsers?: boolean;
  /** Extra env merged into the command's environment. */
  env?: Record<string, string>;
  /** Deterministic stages re-run identically; used for stall detection. */
  deterministic: boolean;
}

/** A remediation hint produced by the analyzer for a failed stage. */
export interface Finding {
  stageId: string;
  /** Short signature name, e.g. "typescript-type-error". */
  signature: string;
  /** What the loop detected. */
  detail: string;
  /** Suggested fix the agent/developer should apply. */
  remediation: string;
  /** Files referenced in the output, if any could be extracted. */
  files: string[];
  /** Lower number = address earlier. */
  priority: number;
}

/** Result of running (or skipping) a single stage. */
export interface StageResult {
  id: string;
  title: string;
  category: StageCategory;
  status: StageStatus;
  blocking: boolean;
  /** Process exit code, or null when skipped. */
  exitCode: number | null;
  durationMs: number;
  /** Why the stage was skipped, when applicable. */
  skipReason?: string;
  /** Trimmed tail of combined stdout/stderr for the report. */
  outputTail: string;
  findings: Finding[];
}

export interface VerificationReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  /** 1-based iteration index within a loop run. */
  iteration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    blockingFailed: number;
    blockingSkipped: number;
  };
  /**
   * True when every blocking stage was *run* and passed (none failed or
   * skipped) AND the run covered the full blocking gate. A partial run (some
   * blocking stages excluded via `--only`/`--skip`) is never production ready.
   */
  productionReady: boolean;
  /**
   * True when at least one blocking stage was excluded from this run (not the
   * same as a prerequisite skip — those still count toward the gate). A partial
   * run can pass its selected stages but cannot certify production readiness.
   */
  partial: boolean;
  stages: StageResult[];
  /** Ordered remediation steps aggregated from all findings. */
  plan: Finding[];
}
