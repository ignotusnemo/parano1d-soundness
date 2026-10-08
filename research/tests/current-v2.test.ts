import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog, loadTrack } from "@/lib/catalog";
import { createChallengeSubmission } from "@/lib/challenge";
import { buildFrontier, FRONTIER_MODELS } from "@/lib/frontier";
import { verifySubmission } from "@/lib/verifier";

const root = path.resolve(".");

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
