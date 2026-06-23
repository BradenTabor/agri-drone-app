import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkboxValue } from "@/lib/form-data";

describe("checkboxValue", () => {
  it('returns true when values are ["false", "true"]', () => {
    const formData = new FormData();
    formData.append("certAttested", "false");
    formData.append("certAttested", "true");
    assert.equal(checkboxValue(formData, "certAttested"), true);
  });

  it('returns false when values are ["false"]', () => {
    const formData = new FormData();
    formData.append("certAttested", "false");
    assert.equal(checkboxValue(formData, "certAttested"), false);
  });

  it("returns false when the key is absent", () => {
    const formData = new FormData();
    assert.equal(checkboxValue(formData, "certAttested"), false);
  });
});
