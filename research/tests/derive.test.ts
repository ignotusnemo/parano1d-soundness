import assert from "node:assert/strict";
import test from "node:test";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { deriveResearchState } from "@/lib/derive";

test("the published end-to-end corollary is proved with explicit production premises", () => {
  const state = deriveResearchState(path.resolve("."));
  assert.equal(state.conclusion.status, "proved");
  assert.deepEqual(state.conclusion.blockingClaims, []);
  assert.deepEqual(state.conclusion.premiseClaims, [
    "coherent-response-minimum",
    "fixed-poseidon2b-delta"
  ]);
  assert.equal(state.claims.find((claim) => claim.id === "adaptive-all-root-qrom")?.status, "proved");
  assert.equal(state.metrics.find((metric) => metric.id === "category-one.margin-over-reference")?.value, "+3.273866314232");
});

test("classical Poseidon projection is not presented as the Category 1 metric", () => {
  const state = deriveResearchState(path.resolve("."));
  const poseidon = state.claims.find((claim) => claim.id === "poseidon2b-classical-audit");
  const categoryOne = state.claims.find((claim) => claim.id === "ideal-category-one-bound");
  assert.equal(poseidon?.metrics[0]?.value, "409.873818620410");
  assert.ok(categoryOne?.metrics.some((metric) => metric.value === "173.273866314232"));
  assert.ok(!categoryOne?.metrics.some((metric) => metric.value === "409.873818620410"));
  assert.ok(!state.metrics.some((metric) => metric.id.startsWith("fs-fri.")));
  assert.ok(!state.metrics.some((metric) => metric.id.startsWith("poseidon2b.")));
});

test("Poseidon2b work factors remain separated by exact attack game", () => {
  const state = deriveResearchState(path.resolve("."));
  const track = state.tracks.find((candidate) => candidate.id === "poseidon2b-attack");
  assert.equal(track?.direction, "non-ranked");
  assert.equal(track?.scoreMetricId, undefined);
  const metricIds = track?.reviewPolicy?.metricRules.map((rule) => rule.id) ?? [];
  assert.ok(!metricIds.includes("poseidon2b.attack-work-bits"));
  assert.ok(metricIds.includes("poseidon2b.permutation-collision-work-bits"));
  assert.ok(metricIds.includes("poseidon2b.compression-collision-work-bits"));
  assert.equal(new Set(metricIds).size, metricIds.length);
});

test("a refuted declared premise visibly invalidates the dependent production conclusion", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-derived-premise-"));
  try {
    cpSync(path.resolve("catalog"), path.join(temporary, "catalog"), { recursive: true });
    cpSync(path.resolve("evidence"), path.join(temporary, "evidence"), { recursive: true });
    mkdirSync(path.join(temporary, "ledger/accepted"), { recursive: true });
    writeFileSync(path.join(temporary, "ledger/accepted/fixed-delta-counterexample.json"), `${JSON.stringify({
      schemaVersion: 1,
      id: "fixed-delta-counterexample",
      recordType: "accepted-submission",
      trackId: "poseidon2b-attack",
      acceptedAt: "2026-08-29T15:00:00.000Z",
      title: "Reviewed fixed delta counterexample",
      note: "A test-only reviewed counterexample refutes the declared fixed compiler deviation condition.",
      attribution: { mode: "human" },
      source: {
        repository: "example/research",
        commit: "0123456789abcdef0123456789abcdef01234567",
        url: "https://github.com/example/research/pull/1",
        authorLogin: "researcher",
        authorUrl: "https://github.com/researcher",
        avatarUrl: "https://avatars.githubusercontent.com/researcher",
        pullRequest: 1
      },
      verification: {
        verifier: "test-review",
        verifierVersion: "1.0.0",
        resultDigest: "0".repeat(64),
        status: "accepted"
      },
      effects: [{ claimId: "fixed-poseidon2b-delta", status: "refuted", metrics: [] }]
    }, null, 2)}\n`);
    const state = deriveResearchState(temporary);
    assert.equal(state.claims.find((claim) => claim.id === "fixed-poseidon2b-delta")?.status, "refuted");
    assert.equal(state.conclusion.status, "premise-failed");
    writeFileSync(path.join(temporary, "ledger/accepted/all-root-counterexample.json"), `${JSON.stringify({
      schemaVersion: 1,
      id: "all-root-counterexample",
      recordType: "accepted-submission",
      trackId: "recursive-all-root-proof",
      acceptedAt: "2026-08-29T15:10:00.000Z",
      title: "Reviewed all-root counterexample",
      note: "A test-only reviewed counterexample contradicts the previously accepted all-root theorem evidence.",
      attribution: { mode: "human" },
      source: {
        repository: "example/research",
        commit: "1123456789abcdef0123456789abcdef01234567",
        url: "https://github.com/example/research/pull/2",
        authorLogin: "researcher",
        authorUrl: "https://github.com/researcher",
        avatarUrl: "https://avatars.githubusercontent.com/researcher",
        pullRequest: 2
      },
      verification: {
        verifier: "test-review",
        verifierVersion: "1.0.0",
        resultDigest: "1".repeat(64),
        status: "accepted"
      },
      effects: [{ claimId: "adaptive-all-root-qrom", status: "refuted", metrics: [] }]
    }, null, 2)}\n`);
    const conflicted = deriveResearchState(temporary);
    assert.equal(conflicted.claims.find((claim) => claim.id === "adaptive-all-root-qrom")?.status, "conflicted");
    assert.equal(conflicted.conclusion.status, "conflicted");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
