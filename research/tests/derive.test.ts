import assert from "node:assert/strict";
import test from "node:test";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { deriveResearchState } from "@/lib/derive";

test("the published end-to-end corollary is proved with explicit production premises", () => {
  const state = deriveResearchState(path.resolve("."));
  assert.equal(state.claims.find((claim) => claim.id === "production-category-one")?.status, "proved");
  assert.deepEqual(state.claims.find((claim) => claim.id === "production-category-one")?.blockingClaims, []);
  assert.ok(state.conclusion.premiseClaims.includes("v2-coherent-response-minimum"));
  assert.ok(state.conclusion.premiseClaims.includes("v2-fixed-poseidon2b-delta"));
  assert.equal(state.claims.find((claim) => claim.id === "adaptive-all-root-qrom")?.status, "proved");
  assert.equal(state.claims.flatMap((claim) => claim.metrics).find((metric) => metric.id === "category-one.margin-over-reference")?.value, "+3.391078499301");
  assert.equal(state.leaderboard[0]?.login, "ignotusnemo");
  assert.equal(state.leaderboard[0]?.accepted, state.records.filter((record) => record.source.authorLogin === "ignotusnemo").length);
  assert.ok((state.leaderboard[0]?.frontierMoves ?? 0) > 0);
});

test("classical Poseidon projection is not presented as the Category 1 metric", () => {
  const state = deriveResearchState(path.resolve("."));
  const poseidon = state.claims.find((claim) => claim.id === "poseidon2b-classical-audit");
  const categoryOne = state.claims.find((claim) => claim.id === "ideal-category-one-bound");
  assert.equal(poseidon?.metrics[0]?.value, "409.873818620410");
  assert.ok(categoryOne?.metrics.some((metric) => metric.value === "173.391078499301"));
  assert.ok(!categoryOne?.metrics.some((metric) => metric.value === "409.873818620410"));
  assert.ok(!state.metrics.some((metric) => metric.id.startsWith("fs-fri.")));
  assert.ok(!state.metrics.some((metric) => metric.id.startsWith("poseidon2b.")));
});

test("theorem context links do not establish current v2 production premises", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-context-only-"));
  let state;
  try {
    cpSync(path.resolve("catalog"), path.join(temporary, "catalog"), { recursive: true });
    cpSync(path.resolve("evidence"), path.join(temporary, "evidence"), { recursive: true });
    for (const id of ["v2-retirement-correspondence-20261008", "v2-selected-parent-transcript-20261008", "v2-snapshot-correspondence-20261008"]) {
      rmSync(path.join(temporary, "evidence/official", `${id}.json`));
    }
    state = deriveResearchState(temporary);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  const claims = new Map(state.claims.map((claim) => [claim.id, claim]));
  for (const id of ["v2-compiler-correspondence", "v2-all-root-composition", "v2-retirement-correspondence"]) {
    const extension = claims.get(id)!;
    assert.equal(extension.status, "premise");
    assert.ok(extension.dependencies.some((dependency) => dependency.role === "context" && claims.get(dependency.claimId)?.status === "proved"));
    assert.deepEqual(extension.evidenceIds, []);
  }
  assert.equal(claims.get("v2-joint-bank-accounting")?.status, "verified");
  assert.ok(state.conclusion.premiseClaims.includes("v2-all-root-composition"));
  assert.ok(state.conclusion.premiseClaims.includes("v2-production-correspondence"));
});

test("scoped v2 source evidence preserves open compiler conditions and numerical frontiers", () => {
  const state = deriveResearchState(path.resolve("."));
  const claims = new Map(state.claims.map((claim) => [claim.id, claim]));
  for (const id of ["v2-retirement-correspondence", "v2-compiler-correspondence", "v2-production-correspondence"]) {
    const claim = claims.get(id)!;
    assert.equal(claim.status, "verified");
    assert.equal(claim.initialStatus, "premise");
    const records = state.records.filter((record) => record.effects.some((effect) => effect.claimId === id));
    assert.equal(records.length, 1);
    assert.equal(records[0]?.recordType, "official-baseline");
    assert.ok(records[0]?.effects.every((effect) => effect.metrics.length === 0));
    assert.ok(!records[0]?.review);
  }
  for (const id of ["v2-all-root-composition", "v2-fixed-poseidon2b-delta", "v2-coherent-response-minimum"]) {
    assert.equal(claims.get(id)?.status, "premise");
    assert.deepEqual(claims.get(id)?.evidenceIds, []);
  }
  assert.match(claims.get("v2-compiler-correspondence")!.scope, /complete adaptive shared-database compiler remain separate/);
  assert.match(claims.get("v2-production-correspondence")!.scope, /does not cover every ordinary-block/);
  assert.match(claims.get("v2-all-root-composition")!.scope, /embedded-verifier oracle queries/);
  const baseline = state.records.find((record) => record.id === "official-v2-accounting-20261008")!;
  for (const metric of state.metrics) {
    assert.deepEqual(metric, baseline.effects.flatMap((effect) => effect.metrics).find((candidate) => candidate.id === metric.id));
  }
  assert.ok(state.records.filter((record) => record.id.startsWith("official-v2-") && record.acceptedAt.startsWith("2026-10-08")).every((record) => record.recordType === "official-baseline"));
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

test("the applicable nonlinear-subspace result has one non-ranked reproduction track", () => {
  const state = deriveResearchState(path.resolve("."));
  const tracks = state.tracks.filter((track) => track.id === "poseidon2b-nonlinear-subspace-reproduction");
  assert.equal(tracks.length, 1);
  assert.equal(tracks[0]?.kind, "reproduction");
  assert.equal(tracks[0]?.direction, "non-ranked");
  assert.equal(tracks[0]?.targetClaimId, "v2-poseidon2b-classical-audit");
  assert.equal(tracks[0]?.scoreMetricId, undefined);
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
    assert.equal(state.claims.find((claim) => claim.id === "production-category-one")?.status, "premise-failed");
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
    assert.equal(conflicted.claims.find((claim) => claim.id === "production-category-one")?.status, "conflicted");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
