import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDashboardKpis,
  computeReadinessScore,
} from "@/components/dashboard/dashboard-tokens";

describe("computeReadinessScore", () => {
  it("returns 100 when no open acreage checks", () => {
    assert.equal(computeReadinessScore(0), 100);
  });

  it("decreases by 12 points per open check", () => {
    assert.equal(computeReadinessScore(1), 88);
    assert.equal(computeReadinessScore(2), 76);
  });

  it("never drops below 35", () => {
    assert.equal(computeReadinessScore(20), 35);
  });
});

describe("buildDashboardKpis", () => {
  it("maps operational counts to four KPI entries", () => {
    const kpis = buildDashboardKpis({
      mixToday: 3,
      appToday: 2,
      openAcreageChecks: 1,
      activeCustomers: 12,
    });

    assert.equal(kpis.length, 4);
    assert.equal(kpis[0]?.value, 3);
    assert.equal(kpis[0]?.href, "/records");
    assert.equal(kpis[1]?.value, 2);
    assert.equal(kpis[2]?.value, 1);
    assert.equal(kpis[3]?.value, 12);
  });
});
