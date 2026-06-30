import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";

describe("decimalToDms", () => {
  it("converts a positive latitude to N hemisphere DMS", () => {
    assert.deepEqual(decimalToDms(30.25, "lat"), {
      degrees: 30,
      minutes: 15,
      seconds: 0,
      hemisphere: "N",
    });
  });

  it("converts a negative longitude to W hemisphere DMS", () => {
    assert.deepEqual(decimalToDms(-97.5, "lng"), {
      degrees: 97,
      minutes: 30,
      seconds: 0,
      hemisphere: "W",
    });
  });

  it("treats zero as the positive hemisphere", () => {
    assert.equal(decimalToDms(0, "lat").hemisphere, "N");
    assert.equal(decimalToDms(0, "lng").hemisphere, "E");
  });

  it("rolls seconds up into the next minute", () => {
    assert.deepEqual(decimalToDms(59.999 / 3600, "lat"), {
      degrees: 0,
      minutes: 1,
      seconds: 0,
      hemisphere: "N",
    });
  });

  it("rolls minutes up into the next degree", () => {
    assert.deepEqual(decimalToDms(3599.999 / 3600, "lat"), {
      degrees: 1,
      minutes: 0,
      seconds: 0,
      hemisphere: "N",
    });
  });

  it("throws on non-finite input", () => {
    assert.throws(() => decimalToDms(Number.NaN, "lat"), /finite number/);
  });

  it("throws when latitude is out of range", () => {
    assert.throws(() => decimalToDms(91, "lat"), /between -90 and 90/);
  });

  it("throws when longitude is out of range", () => {
    assert.throws(() => decimalToDms(-181, "lng"), /between -180 and 180/);
  });
});

describe("dmsToString", () => {
  it("formats a DMS coordinate with two-decimal seconds", () => {
    assert.equal(
      dmsToString({ degrees: 30, minutes: 15, seconds: 0, hemisphere: "N" }),
      "30° 15' 0.00\" N",
    );
  });
});
