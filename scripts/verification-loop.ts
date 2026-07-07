import { spawnSync } from "node:child_process";

export type VerificationStep = {
  name: string;
  command: string;
  args: string[];
};

export type StepStatus = "pending" | "passed" | "failed" | "aborted" | "skipped";

export type StepResult = {
  name: string;
  status: StepStatus;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  detail?: string;
};

export type CertificationResult = {
  certified: boolean;
  exitCode: number;
  message: string;
};

export const requiredVerificationSteps: VerificationStep[] = [
  { name: "lint", command: "npm", args: ["run", "lint"] },
  { name: "typecheck", command: "npm", args: ["run", "typecheck"] },
  { name: "unit tests", command: "npm", args: ["run", "test:unit"] },
];

export function evaluateCertification(args: {
  requiredSteps: readonly VerificationStep[];
  results: readonly StepResult[];
  aborted: boolean;
  abortReason?: string;
}): CertificationResult {
  if (args.aborted) {
    return {
      certified: false,
      exitCode: 130,
      message: `NOT CERTIFIED: verification aborted${args.abortReason ? ` (${args.abortReason})` : ""}.`,
    };
  }

  const failed = args.results.find((result) => result.status === "failed" || result.status === "aborted");
  if (failed) {
    const reason = failed.detail ?? `exit ${failed.exitCode ?? "unknown"}`;
    return {
      certified: false,
      exitCode: failed.status === "aborted" ? 130 : 1,
      message: `NOT CERTIFIED: ${failed.name} ${failed.status} before the full suite completed (${reason}).`,
    };
  }

  const passedStepNames = new Set(
    args.results
      .filter((result) => result.status === "passed")
      .map((result) => result.name),
  );
  const missingSteps = args.requiredSteps
    .map((step) => step.name)
    .filter((name) => !passedStepNames.has(name));

  if (args.results.length !== args.requiredSteps.length || missingSteps.length > 0) {
    return {
      certified: false,
      exitCode: 1,
      message: `NOT CERTIFIED: verification suite was partial; missing full pass for ${missingSteps.join(", ")}.`,
    };
  }

  return {
    certified: true,
    exitCode: 0,
    message: "PRODUCTION READY: full verification suite completed and passed.",
  };
}

export function runVerificationLoop(steps: readonly VerificationStep[] = requiredVerificationSteps): number {
  const results: StepResult[] = [];

  for (const step of steps) {
    console.log(`\n[verify] Starting ${step.name}: ${step.command} ${step.args.join(" ")}`);

    const child = spawnSync(step.command, step.args, {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    if (child.error) {
      results.push({
        name: step.name,
        status: "failed",
        exitCode: null,
        signal: null,
        detail: child.error.message,
      });
      break;
    }

    if (child.signal) {
      results.push({
        name: step.name,
        status: "aborted",
        exitCode: child.status,
        signal: child.signal,
        detail: `signal ${child.signal}`,
      });
      break;
    }

    if (child.status !== 0) {
      results.push({
        name: step.name,
        status: "failed",
        exitCode: child.status,
        signal: null,
        detail: `exit ${child.status ?? "unknown"}`,
      });
      break;
    }

    results.push({
      name: step.name,
      status: "passed",
      exitCode: 0,
      signal: null,
    });
  }

  const result = evaluateCertification({
    requiredSteps: steps,
    results,
    aborted: false,
  });

  console.log(`\n${result.message}`);
  return result.exitCode;
}
