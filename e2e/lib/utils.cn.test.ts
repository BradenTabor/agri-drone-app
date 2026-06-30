import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    assert.equal(cn("a", "b"), "a b");
  });

  it("drops falsy values", () => {
    assert.equal(cn("a", undefined, null, false, "b"), "a b");
  });

  it("merges conflicting tailwind utilities, keeping the last", () => {
    assert.equal(cn("px-2", "px-4"), "px-4");
    assert.equal(cn("p-2", "p-4"), "p-4");
  });
});
