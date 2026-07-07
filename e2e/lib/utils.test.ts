import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins conditional class names", () => {
    assert.equal(cn("base", false && "hidden", ["rounded", "shadow"]), "base rounded shadow");
  });

  it("deduplicates conflicting Tailwind classes with the later class winning", () => {
    assert.equal(cn("px-2 py-1", "px-4", { "py-3": true }), "px-4 py-3");
  });
});
