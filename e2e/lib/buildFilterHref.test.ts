import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFilterHref } from "@/lib/records/buildFilterHref";

describe("buildFilterHref", () => {
  it("returns an empty string when no filters are set", () => {
    assert.equal(buildFilterHref({}), "");
  });

  it("omits empty and whitespace-only values", () => {
    assert.equal(
      buildFilterHref({ q: "corn", customerId: "", dateFrom: "   " }),
      "?q=corn",
    );
  });

  it("encodes multiple filters into a query string", () => {
    assert.equal(
      buildFilterHref({ q: "north field", dateFrom: "2024-01-01" }),
      "?q=north+field&dateFrom=2024-01-01",
    );
  });
});
