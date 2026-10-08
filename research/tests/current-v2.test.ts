import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog, loadTrack } from "@/lib/catalog";
import { createChallengeSubmission } from "@/lib/challenge";
import { buildFrontier, FRONTIER_MODELS } from "@/lib/frontier";
import { verifySubmission } from "@/lib/verifier";
import { readV2Inputs, readV2ObservationCache, writeV2ObservationCache, V2_CERTIFICATE_REVISION } from "@/lib/v2-certificate-runner";

const root = path.resolve(".");

test("all active work targets the current v2 certificate and distinct claims", () => {
  const tracks = loadCatalog(root).tracks.filter((track) => track.state === "active" && track.id !== "official-certificate");
  assert.equal(tracks.length, 8);
  for (const track of tracks) {
    assert.equal(track.expected?.productionCommit, V2_CERTIFICATE_REVISION);
    assert.equal(track.expected?.certificateCommit, V2_CERTIFICATE_REVISION);
    assert.ok(track.targetClaimId.startsWith("v2-"));
    assert.doesNotMatch(track.title, /legacy|v1/i);
  }
});

test("current release inputs reject corruption before any protected execution", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "v2-input-check-"));
  try {
    cpSync(path.join(root, "certificates"), path.join(temporary, "certificates"), { recursive: true });
    assert.equal(readV2Inputs(temporary).length, 4);
    const filename = path.join(temporary, "certificates/v2.0.3/class-0.key.gz");
    writeFileSync(filename, readFileSync(path.join(temporary, "certificates/v2.0.3/class-1.key.gz")));
    assert.throws(() => readV2Inputs(temporary), /protected input digest mismatch/);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});

test("a v2 reproduction rejects altered bank, event inventory and historical source pins", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "v2-payload-check-"));
  const destination = path.join(temporary, "v2-payload-check");
  try {
    createChallengeSubmission({ root, destination, id: "v2-payload-check", trackId: "certificate-reproduction", attribution: { mode: "human" } });
    const filename = path.join(destination, "submission.json");
    const original = JSON.parse(readFileSync(filename, "utf8"));
    for (const [key, value] of [["bankDigest", "0".repeat(64)], ["eventCount", "19"], ["productionCommit", "7f65daaae414128aa4377ca0ac1e96fd6dbc31a5"]]) {
      writeFileSync(filename, JSON.stringify({ ...original, payload: { ...original.payload, [key!]: value } }));
      const result = verifySubmission({ root, submissionDirectory: destination, context: { repository: "local/reproduction", commit: "0".repeat(40), actor: "researcher" } });
      assert.equal(result.status, "rejected");
      assert.ok(result.reasons.some((reason) => reason.includes(key!)));
    }
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});

test("cached protected observations cannot bypass frozen contract checks", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "v2-observation-check-"));
  const cache = path.join(temporary, "cache");
  const previous = process.env.PARANO1D_CERTIFICATE_OBSERVATIONS_DIR;
  const destination = path.join(temporary, "v2-observation-check");
  try {
    const expected = loadTrack(root, "certificate-reproduction").expected!;
    writeV2ObservationCache(cache, V2_CERTIFICATE_REVISION, "mainnet-v2", expected);
    assert.deepEqual(readV2ObservationCache(cache, V2_CERTIFICATE_REVISION, "mainnet-v2"), expected);
    assert.equal(readV2ObservationCache(cache, "1".repeat(40), "mainnet-v2"), undefined);
    assert.equal(readV2ObservationCache(cache, V2_CERTIFICATE_REVISION, "mainnet-v2-poseidon2b"), undefined);
    createChallengeSubmission({ root, destination, id: "v2-observation-check", trackId: "certificate-reproduction", attribution: { mode: "human" } });
    process.env.PARANO1D_CERTIFICATE_OBSERVATIONS_DIR = cache;
    const check = () => verifySubmission({ root, submissionDirectory: destination, context: { repository: "local/reproduction", commit: "0".repeat(40), actor: "researcher" } });
    assert.equal(check().status, "accepted");
    writeV2ObservationCache(cache, V2_CERTIFICATE_REVISION, "mainnet-v2", { ...expected, eventCount: "19" });
    const rejected = check();
    assert.equal(rejected.status, "rejected");
    assert.ok(rejected.reasons.includes("protected observation eventCount differs from the frozen contract"));
  } finally {
    if (previous === undefined) delete process.env.PARANO1D_CERTIFICATE_OBSERVATIONS_DIR;
    else process.env.PARANO1D_CERTIFICATE_OBSERVATIONS_DIR = previous;
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("v2 evidence keeps exact report hashes and a separate conditional frontier", () => {
  const { records } = loadCatalog(root);
  const legacy = buildFrontier(records, FRONTIER_MODELS.find((model) => model.id === "category-one")!);
  const v2 = buildFrontier(records, FRONTIER_MODELS.find((model) => model.id === "v2-category-one")!);
  assert.equal(legacy.lower, 173.391078499301);
  assert.equal(v2.lower, 173.3897612554174);
  assert.equal(v2.events.length, 1);
  assert.equal(v2.events[0]?.record.id, "official-v2-accounting-20261008");
  const report = readFileSync(path.join(root, "evidence/artifacts/2026-10-08/v2-soundness-mainnet.json"));
  const record = records.find((item) => item.id === "official-v2-accounting-20261008")!;
  assert.equal(record.verification.resultDigest, createHash("sha256").update(report).digest("hex"));
  const parsed = JSON.parse(report.toString());
  assert.equal(parsed.events.length, 20);
  assert.equal(parsed.resource_limiting_event, "retirement.b25.query");
  assert.equal(record.effects[0]?.metrics.find((metric) => metric.id === "v2.category-one.ideal-envelope")?.exact, parsed.category_one_ideal_envelope.exact);
  const matrix = readFileSync(path.join(root, "evidence/artifacts/2026-10-08/matrix-reference-check.json"));
  assert.equal(records.find((item) => item.id === "official-matrix-reference-20261008")?.verification.resultDigest, createHash("sha256").update(matrix).digest("hex"));
  assert.equal(JSON.parse(matrix.toString()).values, 296);
});

test("new v2 tasks generate and verify their own source pins, not the legacy defaults", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "v2-contract-pins-"));
  try {
    for (const trackId of ["v2-retirement-binding-audit", "v2-recursive-fiat-shamir-audit"]) {
      const destination = path.join(temporary, trackId);
      const track = loadTrack(root, trackId);
      createChallengeSubmission({ root, destination, id: trackId, trackId, attribution: { mode: "human" } });
      const manifest = JSON.parse(readFileSync(path.join(destination, "submission.json"), "utf8"));
      const report = readFileSync(path.join(destination, "report.md"), "utf8");
      assert.equal(manifest.payload.productionCommit, track.expected?.productionCommit);
      assert.equal(manifest.payload.certificateCommit, track.expected?.certificateCommit);
      assert.ok(report.includes(track.expected!.productionCommit!));
      assert.ok(!report.includes("7f65daaae414128aa4377ca0ac1e96fd6dbc31a5"));
      assert.equal(verifySubmission({ root, submissionDirectory: destination, context: { repository: "local/reproduction", commit: "0".repeat(40), actor: "researcher" } }).status, "pending-review");
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
