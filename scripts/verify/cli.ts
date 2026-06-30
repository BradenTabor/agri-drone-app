/**
 * Autonomous verification loop entrypoint.
 *
 * Runs every quality gate, analyzes failures into a remediation plan, and writes
 * reports to `.verify/`. In `--loop` mode it re-runs the whole suite until the
 * project is production-ready or no further progress is made between passes
 * (stall detection), which is the signal for an agent/developer to intervene.
 *
 * Exit codes: 0 = production ready, 1 = not ready, 2 = stalled.
 */
import { STAGES, findStage } from "./stages";
import { buildReport, printSummary, writeReport } from "./report";
import { runStage, type RunContext } from "./runner";
import type { StageDefinition, StageResult, VerificationReport } from "./types";

interface CliOptions {
  loop: boolean;
  maxIterations: number;
  only: string[] | null;
  skip: string[];
  delayMs: number;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    loop: false,
    maxIterations: 1,
    only: null,
    skip: [],
    delayMs: 0,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--loop":
        options.loop = true;
        if (options.maxIterations < 2) {
          options.maxIterations = 5;
        }
        break;
      case "--max-iterations":
        options.maxIterations = Math.max(1, Number(argv[++i] ?? "1"));
        break;
      case "--only":
        options.only = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--skip":
        options.skip = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--delay-ms":
        options.delayMs = Math.max(0, Number(argv[++i] ?? "0"));
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        process.stderr.write(`[verify] unknown argument: ${arg}\n`);
        printHelp();
        process.exit(2);
    }
  }
  return options;
}

function printHelp(): void {
  process.stdout.write(
    [
      "Autonomous verification loop",
      "",
      "Usage: tsx scripts/verify/cli.ts [options]",
      "",
      "Options:",
      "  --loop                Re-run all suites until green or stalled",
      "  --max-iterations <n>  Max passes in loop mode (default 5)",
      "  --only <ids>          Comma-separated stage ids to run",
      "  --skip <ids>          Comma-separated stage ids to skip",
      "  --delay-ms <n>        Delay between loop iterations",
      "  --verbose             (reserved) verbose output",
      "  -h, --help            Show this help",
      "",
      `Stages: ${STAGES.map((s) => s.id).join(", ")}`,
    ].join("\n") + "\n",
  );
}

function selectStages(options: CliOptions): StageDefinition[] {
  let selected = STAGES;
  if (options.only) {
    const only = options.only;
    for (const id of only) {
      if (!findStage(id)) {
        process.stderr.write(`[verify] --only references unknown stage: ${id}\n`);
        process.exit(2);
      }
    }
    selected = selected.filter((stage) => only.includes(stage.id));
  }
  if (options.skip.length > 0) {
    selected = selected.filter((stage) => !options.skip.includes(stage.id));
  }
  return selected;
}

/** A run is partial when any *blocking* stage is excluded from the selection. */
function isPartialRun(selected: StageDefinition[]): boolean {
  const selectedIds = new Set(selected.map((stage) => stage.id));
  return STAGES.some((stage) => stage.blocking && !selectedIds.has(stage.id));
}

async function runPass(
  stages: StageDefinition[],
  iteration: number,
  verbose: boolean,
  partial: boolean,
): Promise<VerificationReport> {
  const startedAt = Date.now();
  const ctx: RunContext = { buildPassed: false, verbose };
  const results: StageResult[] = [];

  for (const stage of stages) {
    const result = await runStage(stage, ctx);
    if (stage.id === "build") {
      ctx.buildPassed = result.status === "passed";
    }
    results.push(result);
  }

  const report = buildReport(results, startedAt, iteration, partial);
  writeReport(report);
  return report;
}

/** Deterministic failing stages that did not change between passes => stalled. */
function deterministicFailures(report: VerificationReport): string[] {
  return report.stages
    .filter((s) => s.status === "failed")
    .filter((s) => findStage(s.id)?.deterministic)
    .map((s) => s.id)
    .sort();
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const stages = selectStages(options);
  const partial = isPartialRun(stages);

  let report: VerificationReport | null = null;
  let previousDeterministicFailures: string[] | null = null;

  for (let iteration = 1; iteration <= options.maxIterations; iteration += 1) {
    process.stdout.write(
      `\n[verify] ===== Pass ${iteration}/${options.maxIterations} =====\n`,
    );
    report = await runPass(stages, iteration, options.verbose, partial);
    printSummary(report);

    if (report.productionReady) {
      process.stdout.write("\n[verify] Production ready — all blocking stages green.\n");
      process.exit(0);
    }

    // A partial run cannot certify production readiness, but if every selected
    // blocking stage passed it is still a successful gate (exit 0) — looping
    // would not add coverage the selection excludes.
    if (
      partial &&
      report.summary.blockingFailed === 0 &&
      report.summary.blockingSkipped === 0
    ) {
      process.stdout.write(
        "\n[verify] Selected gates passed (partial run — not the full production-ready gate).\n",
      );
      process.exit(0);
    }

    if (!options.loop) {
      break;
    }

    const failures = deterministicFailures(report);
    if (
      previousDeterministicFailures &&
      failures.length > 0 &&
      sameSet(failures, previousDeterministicFailures)
    ) {
      process.stdout.write(
        `\n[verify] Stalled: deterministic stages still failing with no change (${failures.join(", ")}).\n` +
          "[verify] Apply code fixes per the remediation plan, then re-run.\n",
      );
      process.exit(2);
    }
    previousDeterministicFailures = failures;

    if (iteration < options.maxIterations) {
      if (options.delayMs > 0) {
        await delay(options.delayMs);
      }
    }
  }

  process.exit(1);
}

void main();
