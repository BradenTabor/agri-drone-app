import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import { createDraftSaveGuard } from "@/lib/formDrafts/draftSaveGuard";

const DEBOUNCE_MS = 800;

async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

describe("draftSaveGuard (useFormDraft clearDraft race prevention)", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout"] });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("invalidateInFlightSaves cancels a pending debounced save before it fires", () => {
    const guard = createDraftSaveGuard(clearTimeout);
    let upsertCalled = false;

    const timerId = setTimeout(() => {
      guard.clearDebouncedTimerIfMatch(timerId as unknown as number);
      upsertCalled = true;
    }, DEBOUNCE_MS) as unknown as number;
    guard.setDebouncedTimer(timerId);

    guard.invalidateInFlightSaves();

    mock.timers.tick(DEBOUNCE_MS);
    assert.equal(upsertCalled, false);
  });

  it("invalidateInFlightSaves discards an in-flight upsert when it resolves", async () => {
    const guard = createDraftSaveGuard(clearTimeout);
    let saveStatus: "idle" | "saving" | "saved" = "idle";

    const generation = guard.beginSave();
    saveStatus = "saving";

    guard.invalidateInFlightSaves();
    saveStatus = "idle";

    await Promise.resolve().then(() => {
      if (guard.isGenerationCurrent(generation)) {
        saveStatus = "saved";
      }
    });
    await flushPromises();

    assert.notEqual(saveStatus, "saved");
    assert.equal(saveStatus, "idle");
  });

  it("cancelPendingDebouncedSave alone prevents debounced save without bumping generation", () => {
    const guard = createDraftSaveGuard(clearTimeout);
    let saveNowCalled = false;
    const generationBefore = guard.beginSave();

    const timerId = setTimeout(() => {
      saveNowCalled = true;
    }, DEBOUNCE_MS) as unknown as number;
    guard.setDebouncedTimer(timerId);

    guard.cancelPendingDebouncedSave();

    mock.timers.tick(DEBOUNCE_MS);
    assert.equal(saveNowCalled, false);
    assert.equal(guard.isGenerationCurrent(generationBefore), true);
  });
});
