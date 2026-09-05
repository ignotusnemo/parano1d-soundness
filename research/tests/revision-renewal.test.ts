import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog, loadTrack, loadVerificationTrack } from "@/lib/catalog";
import { runCertificate } from "@/lib/certificate-runner";
import { deriveResearchState } from "@/lib/derive";
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import { verifySubmission } from "@/lib/verifier";

const root = path.resolve(".");
const context = { repository: "local/reproduction", commit: "0".repeat(40), actor: "researcher" };

test("the renewed official record matches protected execution and preserves the old baseline", () => {
  const records = loadCatalog(root).records;
  assert.ok(records.some((record) => record.id === "official-certificate-c3ea3342"));
  const current = records.find((record) => record.id === `official-certificate-${CERTIFICATE_REVISION.slice(0, 8)}`)!;
  const observed = runCertificate(path.resolve(root, ".."), CERTIFICATE_REVISION);
  assert.equal(observed.productionCommit, PRODUCTION_REVISION);
  assert.equal(current.source.commit, CERTIFICATE_REVISION);
  assert.equal(current.verification.resultDigest, observed.reportSha256);
  const metrics = current.effects.flatMap((effect) => effect.metrics);
  assert.equal(metrics.find((metric) => metric.id === "category-one.gate-depth-floor")?.value, observed.categoryOneGateDepthBits);
  assert.equal(metrics.find((metric) => metric.id === "category-one.ideal-envelope")?.value, observed.categoryOneIdealEnvelope);
  const state = deriveResearchState(root);
  assert.equal(state.productionRevision, PRODUCTION_REVISION);
  assert.equal(state.certificateRevision, CERTIFICATE_REVISION);
  assert.equal(state.metrics.find((metric) => metric.id === "category-one.gate-depth-floor")?.value, "173.391078499301");
  assert.equal(state.metrics.find((metric) => metric.id === "category-one.ideal-envelope")?.value, "0.049330348213215253");
});

test("old reproduction contracts are replayable but cannot stand in for the current certificate", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-renewal-"));
  const id = "renewal-reproduction-test";
  const directory = path.join(temporary, id);
  mkdirSync(directory);
  try {
    const current = loadTrack(root, "certificate-reproduction");
    const archived = loadVerificationTrack(root, current.id, "1.0.0", true);
    assert.notEqual(archived.expected?.certificateCommit, CERTIFICATE_REVISION);
    const example = JSON.parse(readFileSync(path.join(root, "submissions/examples/reproduction-valid/submission.json"), "utf8"));
    const check = (version: string, payload: unknown, legacy = false) => {
      writeFileSync(path.join(directory, "submission.json"), JSON.stringify({ ...example, id, contractVersion: version, payload }));
      return verifySubmission({ root, submissionDirectory: directory, context, allowLegacyContractVersion: legacy });
    };
    assert.equal(check(current.contractVersion, current.expected).status, "accepted");
    assert.equal(check(archived.contractVersion, archived.expected).status, "rejected");
    assert.equal(check(archived.contractVersion, archived.expected, true).status, "accepted");
    assert.equal(check(current.contractVersion, archived.expected, true).status, "rejected");
    assert.equal(check(archived.contractVersion, current.expected, true).status, "rejected");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("archived manual review contracts retain their original source pair", () => {
  for (const id of ["coherent-response-attack", "poseidon2b-attack", "production-correspondence-audit", "recursive-all-root-proof"]) {
    const current = loadTrack(root, id);
    const archived = loadVerificationTrack(root, id, "1.0.0", true);
    assert.equal(current.expected?.productionCommit, PRODUCTION_REVISION);
    assert.equal(current.expected?.certificateCommit, CERTIFICATE_REVISION);
    assert.equal(archived.expected?.productionCommit, "fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0");
    assert.equal(archived.expected?.certificateCommit, "c3ea3342fbe27111c84046613010f14f13b917c6");
    assert.deepEqual(loadVerificationTrack(root, id, "1.0.0", false), current);
  }
});
