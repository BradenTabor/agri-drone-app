import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";

describe("coordinate formatting", () => {
  it("converts positive latitudes to northern DMS", () => {
    assert.deepEqual(decimalToDms(30.2672, "lat"), {
      degrees: 30,
      minutes: 16,
      seconds: 1.92,
      hemisphere: "N",
    });
  });

  it("converts negative longitudes to western DMS", () => {
    assert.deepEqual(decimalToDms(-97.7431, "lng"), {
      degrees: 97,
      minutes: 44,
      seconds: 35.16,
      hemisphere: "W",
    });
  });

  it("rolls rounded seconds and minutes into the next degree", () => {
    assert.deepEqual(decimalToDms(12.999999, "lat"), {
      degrees: 13,
      minutes: 0,
      seconds: 0,
      hemisphere: "N",
    });
  });

  it("formats DMS values with fixed two-decimal seconds", () => {
    assert.equal(
      dmsToString({
        degrees: 97,
        minutes: 44,
        seconds: 35.16,
        hemisphere: "W",
      }),
      '97° 44\' 35.16" W',
    );
  });

  it("rejects non-finite and out-of-bounds coordinates", () => {
    assert.throws(() => decimalToDms(Number.NaN, "lat"), /finite number/);
    assert.throws(() => decimalToDms(91, "lat"), /Latitude/);
    assert.throws(() => decimalToDms(-181, "lng"), /Longitude/);
  });
});
