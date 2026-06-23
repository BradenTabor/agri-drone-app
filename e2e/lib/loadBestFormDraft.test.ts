import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadBestFormDraft } from "@/lib/formDrafts/serverSync";
import type { DraftEnvelope } from "@/lib/formDrafts/types";
import {
  buildFormDraftKey,
  parseFormDraftKey,
} from "@/lib/formDrafts/types";

type DraftData = { note: string };

function envelope(savedAt: number, note: string): DraftEnvelope<DraftData> {
  return { savedAt, data: { note } };
}

describe("loadBestFormDraft", () => {
  const draftKey = buildFormDraftKey("mix-record", "550e8400-e29b-41d4-a716-446655440000");
  const localDraft = envelope(100, "local");
  const serverDraft = envelope(200, "server");

  it("returns local when only local exists", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => localDraft,
      async () => null,
      parseFormDraftKey,
    );
    assert.deepEqual(result, localDraft);
  });

  it("returns server when only server exists", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => null,
      async () => serverDraft,
      parseFormDraftKey,
    );
    assert.deepEqual(result, serverDraft);
  });

  it("returns null when neither exists", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => null,
      async () => null,
      parseFormDraftKey,
    );
    assert.equal(result, null);
  });

  it("returns local when local.savedAt is newer", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => envelope(300, "local-newer"),
      async () => envelope(200, "server"),
      parseFormDraftKey,
    );
    assert.equal(result?.data.note, "local-newer");
  });

  it("returns server when server.savedAt is newer", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => envelope(100, "local"),
      async () => envelope(200, "server"),
      parseFormDraftKey,
    );
    assert.equal(result?.data.note, "server");
  });

  it("returns local when savedAt values are equal", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => envelope(150, "local-tie"),
      async () => envelope(150, "server-tie"),
      parseFormDraftKey,
    );
    assert.equal(result?.data.note, "local-tie");
  });

  it("returns local when serverFetcher throws", async () => {
    const result = await loadBestFormDraft<DraftData>(
      draftKey,
      () => localDraft,
      async () => {
        throw new Error("network down");
      },
      parseFormDraftKey,
    );
    assert.deepEqual(result, localDraft);
  });

  it("returns local and does not call serverFetcher when parseKey returns null", async () => {
    let serverCalled = false;
    const result = await loadBestFormDraft<DraftData>(
      "invalid-key",
      () => localDraft,
      async () => {
        serverCalled = true;
        return serverDraft;
      },
      () => null,
    );
    assert.deepEqual(result, localDraft);
    assert.equal(serverCalled, false);
  });
});
