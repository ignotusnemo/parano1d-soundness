import assert from "node:assert/strict";
import test from "node:test";
import { exactDecimalDifference } from "@/lib/exact-decimal";

test("exact decimal difference preserves the strongest input precision", () => {
  assert.equal(exactDecimalDifference("173.273866314232", "170", true), "+3.273866314232");
  assert.equal(exactDecimalDifference("169.500", "170", true), "-0.500");
  assert.equal(exactDecimalDifference("170.000", "170", true), "+0.000");
});

test("exact decimal difference never accepts floating point notation", () => {
  assert.throws(() => exactDecimalDifference("1e3", "2"), /invalid exact decimal/u);
});
