import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateCertification,
  type StepResult,
  type VerificationStep,
} from "../../scripts/verification-loop";

const requiredSteps: VerificationStep[] = [
  { name: "lint", command: "npm", args: ["run", "lint"] },
  { name: "typecheck", command: "npm", args: ["run", "typecheck"] },
  { name: "unit tests", command: "npm", args: ["run", "test:unit"] },
];

const pass = (name: string): StepResult => ({
  name,
  status: "passed",
  exitCode: 0,
  signal: null,
});

describe("evaluateCertification", () => {
  it("certifies only when every required step passed", () => {
    const result = evaluateCertification({
      requiredSteps,
      results: requiredSteps.map((step) => pass(step.name)),
      aborted: false,
    });

    assert.equal(result.certified, true);
    assert.equal(result.exitCode, 0);
    assert.match(result.message, /PRODUCTION READY/);
  });

  it("does not certify a partial run even when completed steps passed", () => {
    const result = evaluateCertification({
      requiredSteps,
      results: [pass("lint")],
      aborted: false,
    });

    assert.equal(result.certified, false);
    assert.equal(result.exitCode, 1);
    assert.match(result.message, /partial/);
    assert.match(result.message, /typecheck/);
    assert.match(result.message, /unit tests/);
  });

  it("does not certify failed steps", () => {
    const result = evaluateCertification({
      requiredSteps,
      results: [
        pass("lint"),
        {
          name: "typecheck",
          status: "failed",
          exitCode: 2,
          signal: null,
          detail: "exit 2",
        },
      ],
      aborted: false,
    });

    assert.equal(result.certified, false);
    assert.equal(result.exitCode, 1);
    assert.match(result.message, /typecheck failed/);
  });

  it("does not certify aborted runs", () => {
    const result = evaluateCertification({
      requiredSteps,
      results: [pass("lint")],
      aborted: true,
      abortReason: "SIGINT",
    });

    assert.equal(result.certified, false);
    assert.equal(result.exitCode, 130);
    assert.match(result.message, /aborted/);
  });
});
