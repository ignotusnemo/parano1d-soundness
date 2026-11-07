import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deriveResearchState } from "@/lib/derive";
import { evidenceRecordSchema } from "@/lib/schemas";

const root = path.resolve(".");
const recordFile = "v21-source-resource-closure-20261107.json";
const artifactRoot = path.join(root, "evidence/artifacts/2026-11-07-closure");
const established = ["v21-retirement-correspondence", "v21-production-correspondence", "v21-native-transcript-binding", "v21-resource-envelope", "v21-rs-grouped-agreement", "v21-joint-bank-accounting"];

test("the current source and resource results have an authenticated maintainer receipt", () => {
  const record = evidenceRecordSchema.parse(JSON.parse(readFileSync(path.join(root, "evidence/official", recordFile), "utf8")));
  const manifest = readFileSync(path.join(artifactRoot, "closure-manifest.json"));
  assert.equal(record.verification.resultDigest, createHash("sha256").update(manifest).digest("hex"));
  for (const [filename, digest] of Object.entries(JSON.parse(manifest.toString()).artifacts)) {
    assert.equal(createHash("sha256").update(readFileSync(path.join(artifactRoot, filename))).digest("hex"), digest);
  }
  const source = JSON.parse(readFileSync(path.join(artifactRoot, "source-binding.json"), "utf8"));
  assert.equal(source.productionCommit, "848209d5db75137483cb41a94b310ad11463473f");
  assert.equal(source.classCount, 3);
  assert.equal(source.compactFlags, 7);
  assert.equal(source.nativeAudits.passed, 33);
  assert.equal(source.nativeAudits.failed, 0);
  assert.equal(source.nativeAudits.installedSource.sources.length, 3);
  assert.equal(record.recordType, "official-baseline");
  assert.equal(record.attribution.mode, "project");
  assert.equal("review" in record, false);
  assert.ok(record.effects.every(effect => effect.metrics.length === 0));
  const state = deriveResearchState(root);
  for (const id of established) assert.ok(["verified", "proved"].includes(state.claims.find(claim => claim.id === id)!.status), id);
  assert.deepEqual(state.conclusion.premiseClaims, ["v21-all-root-composition", "v21-fixed-poseidon2b-delta"]);
  assert.deepEqual(state.conclusion.blockingClaims, []);
  assert.equal(state.claims.find(claim => claim.id === "v21-compiler-correspondence")?.status, "premise");
  assert.equal(state.claims.find(claim => claim.id === "v21-coherent-response-minimum")?.status, "premise");
});

for (const target of ["v21-native-transcript-binding", "v21-compiler-correspondence", "v21-fixed-poseidon2b-delta", "v21-coherent-response-minimum"]) {
  test(`a counterexample to ${target} propagates according to the proved dependency`, () => {
    const temporary = mkdtempSync(path.join(tmpdir(), "v21-closure-counterexample-"));
    try {
      cpSync(path.join(root, "catalog"), path.join(temporary, "catalog"), { recursive: true });
      cpSync(path.join(root, "evidence"), path.join(temporary, "evidence"), { recursive: true });
      const before = deriveResearchState(temporary);
      const record = JSON.parse(readFileSync(path.join(root, "evidence/official", recordFile), "utf8"));
      writeFileSync(path.join(temporary, "evidence/official/test-counterexample.json"), JSON.stringify({ ...record,
        id: "test-closure-counterexample", acceptedAt: "2026-11-08T00:00:00.000Z",
        title: "Test fixture: dependency counterexample", effects: [{ claimId: target, status: "refuted", metrics: [] }]
      }));
      const after = deriveResearchState(temporary);
      assert.deepEqual(after.metrics, before.metrics);
      if (target === "v21-coherent-response-minimum") {
        assert.equal(after.claims.find(claim => claim.id === target)?.status, "refuted");
        assert.deepEqual(after.conclusion, before.conclusion);
      } else {
        assert.ok(["conflicted", "premise-failed"].includes(after.conclusion.status));
        if (target === "v21-compiler-correspondence") {
          assert.equal(after.claims.find(claim => claim.id === "v21-all-root-composition")?.status, "premise-failed");
        }
      }
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  });
}
