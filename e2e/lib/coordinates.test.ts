import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";

describe("decimalToDms", () => {
  it("converts a positive latitude to N hemisphere DMS", () => {
    assert.deepEqual(decimalToDms(30.5, "lat"), {
      degrees: 30,
      minutes: 30,
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

  it("carries seconds and minutes up to the next degree on rounding", () => {
    // 0.999999 rounds seconds to 60, which rolls into minutes and then degrees.
    assert.deepEqual(decimalToDms(0.999999, "lng"), {
      degrees: 1,
      minutes: 0,
      seconds: 0,
      hemisphere: "E",
    });
  });

  it("accepts the exact boundary values", () => {
    assert.equal(decimalToDms(90, "lat").degrees, 90);
    assert.equal(decimalToDms(-90, "lat").hemisphere, "S");
    assert.equal(decimalToDms(180, "lng").degrees, 180);
    assert.equal(decimalToDms(-180, "lng").hemisphere, "W");
  });

  it("throws for non-finite numbers", () => {
    assert.throws(() => decimalToDms(Number.NaN, "lat"), /finite number/);
    assert.throws(() => decimalToDms(Number.POSITIVE_INFINITY, "lng"), /finite number/);
  });

  it("throws when latitude is out of range", () => {
    assert.throws(() => decimalToDms(90.0001, "lat"), /between -90 and 90/);
    assert.throws(() => decimalToDms(-91, "lat"), /between -90 and 90/);
  });

  it("throws when longitude is out of range", () => {
    assert.throws(() => decimalToDms(180.0001, "lng"), /between -180 and 180/);
    assert.throws(() => decimalToDms(-200, "lng"), /between -180 and 180/);
  });
});

describe("dmsToString", () => {
  it("formats DMS with two-decimal seconds and hemisphere", () => {
    assert.equal(
      dmsToString({ degrees: 30, minutes: 15, seconds: 27, hemisphere: "N" }),
      `30° 15' 27.00" N`,
    );
  });

  it("pads fractional seconds to two decimals", () => {
    assert.equal(
      dmsToString({ degrees: 97, minutes: 0, seconds: 5.1, hemisphere: "W" }),
      `97° 0' 5.10" W`,
    );
  });
});
