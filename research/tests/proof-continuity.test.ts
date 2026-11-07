import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deriveResearchState } from "@/lib/derive";
import { evidenceRecordSchema } from "@/lib/schemas";

const root = path.resolve(".");
const filename = "v21-rs-restoration-20261107.json";

test("the RS theorem instantiation is attached to its exact receipt and scope", () => {
  const state = deriveResearchState(root);
  const record = evidenceRecordSchema.parse(JSON.parse(readFileSync(path.join(root, "evidence/official", filename), "utf8")));
  const receipt = readFileSync(path.join(root, "evidence/artifacts/2026-11-07/rs-grouped-restoration.json"));
  assert.equal(record.verification.resultDigest, createHash("sha256").update(receipt).digest("hex"));
  assert.equal(JSON.parse(receipt.toString()).checkedLayers, 421);
  assert.deepEqual(record.effects, [{ claimId: "v21-rs-grouped-agreement", status: "verified", metrics: [] }]);
  assert.ok(state.claims.find((claim) => claim.id === "v21-rs-grouped-agreement")?.scope.includes("Public-coin"));
  assert.ok(state.claims.find((claim) => claim.id === "v21-rs-grouped-agreement")?.evidenceIds.includes(record.id));
});

test("closing local RS restoration preserves old proofs and broader current conditions", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "proof-continuity-"));
  try {
    cpSync(root, temporary, { recursive: true, filter: (source) => source !== path.join(root, "node_modules") });
    rmSync(path.join(temporary, "evidence/official", filename));
    const before = deriveResearchState(temporary);
    const after = deriveResearchState(root);
    const unchanged = ["v2-retirement-correspondence", "v2-compiler-correspondence", "v2-production-correspondence", "v21-compiler-correspondence", "v21-production-correspondence", "v21-all-root-composition", "v21-fixed-poseidon2b-delta", "v21-coherent-response-minimum"];
    for (const id of unchanged) assert.deepEqual(after.claims.find((claim) => claim.id === id), before.claims.find((claim) => claim.id === id));
    assert.deepEqual(after.metrics, before.metrics);
    assert.equal(before.claims.find((claim) => claim.id === "v21-rs-grouped-agreement")?.status, "premise");
    assert.equal(after.claims.find((claim) => claim.id === "v21-rs-grouped-agreement")?.status, "verified");
    assert.deepEqual(after.modelLeaderboard, before.modelLeaderboard);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
