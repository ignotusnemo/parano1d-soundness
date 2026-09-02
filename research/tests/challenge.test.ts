import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createChallengeSubmission, sealChallengeSubmission } from "@/lib/challenge";
import { loadCatalog } from "@/lib/catalog";
import { parseStrictJson } from "@/lib/strict-json";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { loadSubmission, verifySubmission } from "@/lib/verifier";

test("every active public contract and agent task has a consistent publication boundary", () => {
  const root = path.resolve(".");
  const catalog = loadCatalog(root);
  for (const track of catalog.tracks.filter((candidate) => candidate.state === "active" && candidate.id !== "official-certificate")) {
    assert.ok(track.contractUrl, `${track.id} must publish its contract`);
    const contractName = path.basename(new URL(track.contractUrl!).pathname);
    const contractPath = path.join(root, "contracts", contractName);
    assert.equal(readFileSync(contractPath, "utf8").includes(`v${track.contractVersion}`), true, `${track.id} contract version must match the catalog`);
    const taskPath = path.join(root, "challenges", track.id, "AGENT_TASK.md");
    const task = readFileSync(taskPath, "utf8");
    assert.equal(task.includes(`contracts/${contractName}`), true, `${track.id} task must name its active contract`);
  }

  const poseidon = catalog.tracks.find((track) => track.id === "poseidon2b-attack");
  assert.deepEqual(poseidon?.submissionPolicy?.allowedFindings, ["challenges", "supports"]);
  assert.equal(poseidon?.submissionPolicy?.artifactRequired, true);
  assert.equal(catalog.tracks.filter((track) => track.submissionPolicy !== undefined).length, 1);
});

test("an agent-ready workspace seals passive evidence and reaches contract review", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-challenge-test-"));
  const destination = path.join(temporary, "production-audit-result");
  try {
    mkdirSync(temporary, { recursive: true });
    const files = createChallengeSubmission({
      root: path.resolve("."),
      destination,
      id: "production-audit-result",
      trackId: "production-correspondence-audit",
      attribution: {
        mode: "ai-assisted",
        model: { provider: "openai", model: "gpt-5", displayName: "GPT-5", agent: "Codex" }
      }
    });
    assert.deepEqual(files.map((file) => path.basename(file)), ["submission.json", "report.md"]);
    writeFileSync(path.join(destination, "artifact.json"), "{\"schemaVersion\":1,\"kind\":\"source-map\",\"entries\":[]}\n");
    const sealed = sealChallengeSubmission(destination);
    assert.equal(sealed.payload.artifactPath, "artifact.json");
    assert.match(String(sealed.payload.artifactSha256), /^[0-9a-f]{64}$/u);
    const result = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: {
        repository: "local/autoresearch",
        commit: "0000000000000000000000000000000000000000",
        actor: "local-researcher"
      },
      checkedAt: "2026-08-29T12:00:00.000Z"
    });
    assert.equal(result.status, "pending-review");
    assert.equal(parseStrictJson(readFileSync(path.join(destination, "artifact.json"), "utf8")) !== null, true);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("the nonlinear-subspace reproduction is machine checked and promoted without a frontier metric", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-nonlinear-reproduction-"));
  const destination = path.join(temporary, "nonlinear-subspace-reproduction");
  try {
    const files = createChallengeSubmission({
      root: path.resolve("."),
      destination,
      id: "nonlinear-subspace-reproduction",
      trackId: "poseidon2b-nonlinear-subspace-reproduction",
      attribution: { mode: "human" }
    });
    assert.deepEqual(files.map((file) => path.basename(file)), ["submission.json"]);
    const result = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: {
        repository: "ignotusnemo/parano1d-soundness",
        commit: "1".repeat(40),
        actor: "ignotusnemo",
        pullRequest: 46
      },
      checkedAt: "2026-09-02T12:00:00.000Z"
    });
    assert.equal(result.status, "accepted");
    assert.equal(result.observed.poseidonNonlinearRankCore, "0000000000000000000000000000be32");
    assert.equal(result.observed.poseidonNonlinearProjectionBits, "1022.830074998558");
    const record = evidenceFromAcceptedResult(loadSubmission(destination), result);
    assert.deepEqual(record.effects, [{ claimId: "poseidon2b-classical-audit", status: "verified", metrics: [] }]);
    assert.equal(record.source.authorLogin, "ignotusnemo");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

function productionImpactArtifact() {
  return {
    schemaVersion: 1,
    artifactType: "poseidon2b-production-impact-v1",
    finding: "challenges",
    productionCommit: "fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0",
    game: "poseidon2b.compression-collision-work-bits",
    productionPath: {
      entryPoints: ["noid_ivc_core::merkle::hash_pair"],
      sourceLocations: ["https://github.com/ignotusnemo/parano1d/blob/fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0/noid_ivc_core/src/merkle.rs"],
      validInputDerivation: "Both colliding child digests are derived from complete valid production leaf encodings and lower node evaluations at the pinned commit, with every intermediate digest included in the witness.",
      observedEffect: "The independently replayed valid production artifacts contain different committed data but produce the same accepted PCS root at the exact verifier entry point named above."
    },
    evidence: {
      kind: "two-valid-production-artifacts-same-binding",
      witnesses: [{
        label: "Two valid PCS trees",
        description: "Canonical passive encodings of both complete production trees and every intermediate node needed to reproduce the shared accepted root.",
        sha256: "a".repeat(64)
      }],
      reproductionSteps: ["Replay both canonical trees with the pinned production verifier and compare their accepted roots."],
      expectedResult: "Both valid but different production artifacts are accepted and yield the same root commitment."
    }
  };
}

test("the Poseidon2b track rejects component-only evidence and requires a production-impact artifact", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-poseidon-gate-test-"));
  const destination = path.join(temporary, "reachable-poseidon-result");
  try {
    createChallengeSubmission({
      root: path.resolve("."),
      destination,
      id: "reachable-poseidon-result",
      trackId: "poseidon2b-attack",
      attribution: { mode: "ai-assisted", model: { provider: "openai", model: "gpt-5", displayName: "GPT-5", agent: "Codex" } }
    });
    const missing = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" }
    });
    assert.equal(missing.status, "rejected");
    assert.ok(missing.reasons.includes("the active contract requires a structured production-impact artifact"));

    writeFileSync(path.join(destination, "artifact.json"), JSON.stringify({
      schemaVersion: 1,
      artifactType: "poseidon2b-compression-collision-witness-v1",
      finding: "challenges",
      arbitraryChildDigests: true
    }));
    sealChallengeSubmission(destination);
    const componentOnly = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" }
    });
    assert.equal(componentOnly.status, "rejected");
    assert.ok(componentOnly.reasons.some((reason) => reason.includes("production-impact artifact rejected")));

    writeFileSync(path.join(destination, "artifact.json"), `${JSON.stringify(productionImpactArtifact(), null, 2)}\n`);
    sealChallengeSubmission(destination);
    const qualifying = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" }
    });
    assert.equal(qualifying.status, "pending-review");

    const manifestPath = path.join(destination, "submission.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { payload: { finding: string } };
    manifest.payload.finding = "inconclusive";
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const inconclusive = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" }
    });
    assert.equal(inconclusive.status, "rejected");
    assert.ok(inconclusive.reasons.includes("the active contract does not accept inconclusive submissions"));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("legacy Poseidon2b submissions are accepted only for historical ledger verification", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-poseidon-legacy-test-"));
  const destination = path.join(temporary, "legacy-poseidon-result");
  try {
    createChallengeSubmission({
      root: path.resolve("."),
      destination,
      id: "legacy-poseidon-result",
      trackId: "poseidon2b-attack",
      attribution: { mode: "human" }
    });
    const manifestPath = path.join(destination, "submission.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { contractVersion: string; payload: { finding: string } };
    manifest.contractVersion = "1.0.0";
    manifest.payload.finding = "inconclusive";
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const current = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" }
    });
    assert.equal(current.status, "rejected");
    assert.ok(current.reasons.includes("submission contract version does not match the active track"));

    const historical = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: { repository: "local/autoresearch", commit: "0".repeat(40), actor: "local-researcher" },
      allowLegacyContractVersion: true
    });
    assert.equal(historical.status, "pending-review");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
