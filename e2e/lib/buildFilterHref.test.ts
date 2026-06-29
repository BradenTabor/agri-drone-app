import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFilterHref } from "@/lib/records/buildFilterHref";

describe("buildFilterHref", () => {
  it("returns an empty string when no filters are set", () => {
    assert.equal(buildFilterHref({}), "");
  });

  it("builds a query string from a single filter", () => {
    assert.equal(buildFilterHref({ q: "corn" }), "?q=corn");
  });

  it("omits whitespace-only values", () => {
    assert.equal(buildFilterHref({ q: "   " }), "");
  });

  it("keeps the original (untrimmed) value when it has content", () => {
    assert.equal(buildFilterHref({ q: "a b" }), "?q=a+b");
  });

  it("includes multiple filters in object order", () => {
    assert.equal(
      buildFilterHref({ q: "corn", customerId: "c1", page: "2" }),
      "?q=corn&customerId=c1&page=2",
    );
  });

  it("url-encodes reserved characters", () => {
    assert.equal(buildFilterHref({ customerId: "a&b" }), "?customerId=a%26b");
  });
});
