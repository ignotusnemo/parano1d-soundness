import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadTrack, loadVerificationTrack } from "@/lib/catalog";
import { createChallengeSubmission } from "@/lib/challenge";
import { deriveResearchState } from "@/lib/derive";
import { FRONTIER_MODELS, buildFrontier } from "@/lib/frontier";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { runV21Certificate, V21_CERTIFICATE_REVISION, V21_PRODUCTION_REVISION } from "@/lib/v21-certificate-runner";
import { loadSubmission, verifySubmission } from "@/lib/verifier";

const root = path.resolve(".");
const repository = process.env.PARANO1D_SOUNDNESS_DIR ?? path.resolve(root, "..");
const context = { repository: "local/reproduction", commit: "0".repeat(40), actor: "researcher" };

test("v2.1 cold protected execution matches every frozen field", () => {
  assert.deepEqual(runV21Certificate(repository, V21_CERTIFICATE_REVISION), loadTrack(root, "certificate-reproduction").expected);
  assert.throws(() => runV21Certificate(repository, V21_PRODUCTION_REVISION), /unsupported protected/);
});

test("a v2.1 reproduction is promoted to its own claim without changing a frontier", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "v21-reproduction-"));
  const directory = path.join(temporary, "v21-reproduction");
  try {
    createChallengeSubmission({ root, destination: directory, id: "v21-reproduction", trackId: "certificate-reproduction", attribution: { mode: "human" } });
    const result = verifySubmission({ root, submissionDirectory: directory, context });
    assert.equal(result.status, "accepted", result.reasons.join("; "));
    assert.deepEqual(evidenceFromAcceptedResult(loadSubmission(directory), result).effects, [{ claimId: "v21-joint-bank-accounting", status: "verified", metrics: [] }]);
    const filename = path.join(directory, "submission.json");
    const original = JSON.parse(readFileSync(filename, "utf8"));
    for (const [key, value] of [["bankDigest", "0".repeat(64)], ["classCount", "2"], ["eventCount", "20"], ["productionCommit", "50d6dac5a37b9f1be425b5e6cd823de48f843b50"]]) {
      writeFileSync(filename, JSON.stringify({ ...original, payload: { ...original.payload, [key!]: value } }));
      const rejected = verifySubmission({ root, submissionDirectory: directory, context });
      assert.equal(rejected.status, "rejected");
      assert.ok(rejected.reasons.some((reason) => reason.includes(key!)));
    }
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});

test("the v2.1 baseline keeps distinct source, claim and metric namespaces", () => {
  const state = deriveResearchState(root);
  assert.equal(state.productionRevision, V21_PRODUCTION_REVISION);
  assert.equal(state.certificateRevision, V21_CERTIFICATE_REVISION);
  assert.equal(state.claims.find((claim) => claim.id === "v21-joint-bank-accounting")?.status, "verified");
  assert.equal(state.claims.find((claim) => claim.id === "v21-rs-grouped-agreement")?.status, "premise");
  const report = readFileSync(path.join(root, "evidence/artifacts/2026-11-06/v21-soundness-mainnet.json"));
  const record = state.records.find((entry) => entry.id === "official-v21-accounting-20261106")!;
  assert.equal(record.source.commit, V21_CERTIFICATE_REVISION);
  assert.equal(record.verification.resultDigest, createHash("sha256").update(report).digest("hex"));
  const current = buildFrontier(state.records, FRONTIER_MODELS.find((model) => model.id === "v21-category-one")!);
  const previous = buildFrontier(state.records, FRONTIER_MODELS.find((model) => model.id === "v2-category-one")!);
  assert.equal(current.lower, 173.3897612554174);
  assert.equal(current.lower, previous.lower);
  assert.deepEqual(current.events.map((event) => event.record.id), [record.id]);
  assert.equal(loadVerificationTrack(root, "certificate-reproduction", "2.0.0", true).expected?.eventCount, "20");
  assert.equal(loadTrack(root, "certificate-reproduction").expected?.eventCount, "26");
});
