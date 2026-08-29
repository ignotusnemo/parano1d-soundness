import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { derivePlatformState } from "@/lib/derive";

test("the current production conclusion remains conditional on exact blockers", () => {
  const state = derivePlatformState(path.resolve("."));
  assert.equal(state.conclusion.status, "conditional");
  assert.deepEqual(state.conclusion.blockingClaims, [
    "adaptive-all-root-qrom",
    "coherent-response-minimum",
    "fixed-poseidon2b-delta"
  ]);
});

test("classical Poseidon projection is not presented as the Category 1 metric", () => {
  const state = derivePlatformState(path.resolve("."));
  const poseidon = state.claims.find((claim) => claim.id === "poseidon2b-classical-audit");
  const categoryOne = state.claims.find((claim) => claim.id === "ideal-category-one-bound");
  assert.equal(poseidon?.metrics[0]?.value, "409.873818620410");
  assert.ok(categoryOne?.metrics.some((metric) => metric.value === "173.273866314232"));
  assert.ok(!categoryOne?.metrics.some((metric) => metric.value === "409.873818620410"));
});
