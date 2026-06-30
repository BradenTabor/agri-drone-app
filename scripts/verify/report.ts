import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildPlan } from "./analyzer";
import type { StageResult, VerificationReport } from "./types";

export const OUTPUT_DIR = join(process.cwd(), ".verify");
const REPORT_JSON = join(OUTPUT_DIR, "report.json");
const REPORT_MD = join(OUTPUT_DIR, "report.md");
const HISTORY = join(OUTPUT_DIR, "history.jsonl");

export function buildReport(
  stages: StageResult[],
  startedAt: number,
  iteration: number,
): VerificationReport {
  const finishedAt = Date.now();
  const passed = stages.filter((s) => s.status === "passed").length;
  const failed = stages.filter((s) => s.status === "failed").length;
  const skipped = stages.filter((s) => s.status === "skipped").length;
  const blockingFailed = stages.filter(
    (s) => s.blocking && s.status === "failed",
  ).length;
  const blockingSkipped = stages.filter(
    (s) => s.blocking && s.status === "skipped",
  ).length;

  const plan = buildPlan(stages.flatMap((s) => s.findings));

  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    iteration,
    summary: {
      total: stages.length,
      passed,
      failed,
      skipped,
      blockingFailed,
      blockingSkipped,
    },
    productionReady: blockingFailed === 0 && blockingSkipped === 0,
    stages,
    plan,
  };
}

function renderMarkdown(report: VerificationReport): string {
  const statusIcon: Record<StageResult["status"], string> = {
    passed: "PASS",
    failed: "FAIL",
    skipped: "SKIP",
  };

  const lines: string[] = [];
  lines.push("# Verification Loop Report");
  lines.push("");
  lines.push(
    `- **Production ready:** ${report.productionReady ? "YES ✅" : "NO ❌"}`,
  );
  lines.push(`- **Iteration:** ${report.iteration}`);
  lines.push(`- **Finished:** ${report.finishedAt}`);
  lines.push(`- **Duration:** ${(report.durationMs / 1000).toFixed(1)}s`);
  lines.push(
    `- **Summary:** ${report.summary.passed} passed / ${report.summary.failed} failed / ${report.summary.skipped} skipped`,
  );
  lines.push("");

  lines.push("## Stages");
  lines.push("");
  lines.push("| Stage | Category | Blocking | Status | Duration | Note |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const stage of report.stages) {
    const note =
      stage.status === "skipped"
        ? stage.skipReason ?? ""
        : stage.status === "failed"
          ? `exit ${stage.exitCode}`
          : "";
    lines.push(
      `| ${stage.id} | ${stage.category} | ${stage.blocking ? "yes" : "no"} | ${statusIcon[stage.status]} | ${(stage.durationMs / 1000).toFixed(1)}s | ${note} |`,
    );
  }
  lines.push("");

  if (report.plan.length > 0) {
    lines.push("## Remediation plan");
    lines.push("");
    report.plan.forEach((finding, index) => {
      lines.push(
        `${index + 1}. **[${finding.stageId}] ${finding.signature}** — ${finding.detail}`,
      );
      lines.push(`   - Fix: ${finding.remediation}`);
      if (finding.files.length > 0) {
        lines.push(`   - Files: ${finding.files.join(", ")}`);
      }
    });
    lines.push("");
  } else {
    lines.push("## Remediation plan");
    lines.push("");
    lines.push("No failures detected. Nothing to remediate.");
    lines.push("");
  }

  const failedOrSkipped = report.stages.filter((s) => s.status !== "passed");
  if (failedOrSkipped.some((s) => s.status === "failed")) {
    lines.push("## Failure output (tails)");
    lines.push("");
    for (const stage of failedOrSkipped) {
      if (stage.status !== "failed") {
        continue;
      }
      lines.push(`### ${stage.id}`);
      lines.push("");
      lines.push("```");
      lines.push(stage.outputTail);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function writeReport(report: VerificationReport): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  writeFileSync(REPORT_MD, renderMarkdown(report));
  appendFileSync(
    HISTORY,
    `${JSON.stringify({
      finishedAt: report.finishedAt,
      iteration: report.iteration,
      productionReady: report.productionReady,
      summary: report.summary,
      failedStages: report.stages
        .filter((s) => s.status === "failed")
        .map((s) => s.id),
    })}\n`,
  );
}

export function printSummary(report: VerificationReport): void {
  process.stdout.write("\n" + "=".repeat(60) + "\n");
  process.stdout.write("VERIFICATION SUMMARY\n");
  process.stdout.write("=".repeat(60) + "\n");
  for (const stage of report.stages) {
    const label = stage.status.toUpperCase().padEnd(7);
    const note =
      stage.status === "skipped" ? ` (${stage.skipReason ?? ""})` : "";
    process.stdout.write(`  ${label} ${stage.id}${note}\n`);
  }
  process.stdout.write("-".repeat(60) + "\n");
  process.stdout.write(
    `  ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped\n`,
  );
  process.stdout.write(
    `  Production ready: ${report.productionReady ? "YES" : "NO"}\n`,
  );
  if (report.plan.length > 0) {
    process.stdout.write("\n  Remediation plan:\n");
    report.plan.forEach((finding, index) => {
      process.stdout.write(
        `   ${index + 1}. [${finding.stageId}] ${finding.detail}\n      -> ${finding.remediation}\n`,
      );
    });
  }
  process.stdout.write(
    `\n  Full report: .verify/report.md (+ report.json, history.jsonl)\n`,
  );
  process.stdout.write("=".repeat(60) + "\n");
}
