import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { analyzeFailure } from "./analyzer";
import type { StageDefinition, StageResult } from "./types";

const OUTPUT_TAIL_LINES = 40;

/** State shared across stages within a single verification pass. */
export interface RunContext {
  /** Whether the production build stage passed this pass. */
  buildPassed: boolean;
  /** Print full command output (vs. only a tail on failure). */
  verbose: boolean;
}

function missingEnv(stage: StageDefinition): string[] {
  return (stage.requiredEnv ?? []).filter((name) => !process.env[name]?.trim());
}

/** Best-effort detection of installed Playwright browsers. */
function browsersInstalled(): boolean {
  const candidates = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(homedir(), ".cache", "ms-playwright"),
    join(homedir(), "Library", "Caches", "ms-playwright"),
  ].filter((path): path is string => Boolean(path));

  for (const dir of candidates) {
    try {
      if (existsSync(dir) && readdirSync(dir).some((entry) => entry.startsWith("chromium"))) {
        return true;
      }
    } catch {
      // Ignore unreadable candidate dirs.
    }
  }
  return false;
}

function tail(text: string, lines: number): string {
  const split = text.replace(/\s+$/, "").split("\n");
  if (split.length <= lines) {
    return split.join("\n");
  }
  return split.slice(split.length - lines).join("\n");
}

function runCommand(
  command: string,
  env: Record<string, string>,
): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      env: { ...process.env, ...env },
    });

    let output = "";
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, output });
    });
    child.on("error", (error) => {
      output += `\n[verify] failed to spawn command: ${error.message}\n`;
      resolve({ exitCode: 1, output });
    });
  });
}

function skipped(
  stage: StageDefinition,
  reason: string,
): StageResult {
  return {
    id: stage.id,
    title: stage.title,
    category: stage.category,
    status: "skipped",
    blocking: stage.blocking,
    exitCode: null,
    durationMs: 0,
    skipReason: reason,
    outputTail: "",
    findings: [],
  };
}

/** Determine whether a stage should be skipped before running it. */
function resolveSkip(stage: StageDefinition, ctx: RunContext): string | null {
  const missing = missingEnv(stage);
  if (missing.length > 0) {
    return `Missing required env: ${missing.join(", ")}.`;
  }
  if (stage.needsBuild && !ctx.buildPassed) {
    return "Requires a successful production build first (build stage did not pass).";
  }
  if (stage.requiresBrowsers && !browsersInstalled()) {
    return "Playwright browsers not installed (run `npx playwright install --with-deps chromium`).";
  }
  return null;
}

export async function runStage(
  stage: StageDefinition,
  ctx: RunContext,
): Promise<StageResult> {
  const skipReason = resolveSkip(stage, ctx);
  if (skipReason) {
    process.stdout.write(`\n[verify] SKIP ${stage.id}: ${skipReason}\n`);
    return skipped(stage, skipReason);
  }

  process.stdout.write(`\n[verify] RUN  ${stage.id}: ${stage.command}\n`);
  const startedAt = Date.now();
  const { exitCode, output } = await runCommand(stage.command, stage.env ?? {});
  const durationMs = Date.now() - startedAt;
  const status = exitCode === 0 ? "passed" : "failed";

  const result: StageResult = {
    id: stage.id,
    title: stage.title,
    category: stage.category,
    status,
    blocking: stage.blocking,
    exitCode,
    durationMs,
    outputTail: tail(output, OUTPUT_TAIL_LINES),
    findings: status === "failed" ? analyzeFailure(stage, output) : [],
  };

  process.stdout.write(
    `[verify] ${status.toUpperCase()} ${stage.id} (${(durationMs / 1000).toFixed(1)}s, exit ${exitCode})\n`,
  );
  return result;
}
