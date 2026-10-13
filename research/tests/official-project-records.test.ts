import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { deriveResearchState } from "@/lib/derive";
import { evidenceRecordSchema, submissionManifestSchema } from "@/lib/schemas";

const root = path.resolve(".");
const filename = "v2-october-attacks-20261013.json";
const record = evidenceRecordSchema.parse(JSON.parse(readFileSync(path.join(root, "evidence/official", filename), "utf8")));

test("project attribution is confined to official certificate publications", () => {
  assert.equal(record.attribution.mode, "project");
  assert.equal(evidenceRecordSchema.safeParse({ ...record, recordType: "accepted-submission" }).success, false);
  assert.equal(evidenceRecordSchema.safeParse({ ...record, trackId: "certificate-reproduction" }).success, false);
  assert.equal(submissionManifestSchema.safeParse({ schemaVersion: 1, id: "project-test", track: "certificate-reproduction", contractVersion: "v2-2026-10-08", title: record.title, note: record.note, attribution: record.attribution, payload: {} }).success, false);
});

test("the October publication authenticates the exact v2 result and source receipts", () => {
  const artifacts = path.join(root, "evidence/artifacts/2026-10-13");
  const report = readFileSync(path.join(artifacts, "v2-soundness-mainnet.json"));
  const parsed = JSON.parse(report.toString());
  const screening = JSON.parse(readFileSync(path.join(artifacts, "attack-screening.json"), "utf8"));
  assert.equal(createHash("sha256").update(report).digest("hex"), record.verification.resultDigest);
  assert.equal(screening.productionRevision, record.verification.verifierVersion);
  assert.equal(screening.sourceReceipts.length, 15);
  assert.ok(screening.sourceReceipts.every((source: { matchesProductionPin: boolean }) => source.matchesProductionPin));
  assert.equal(parsed.events.length, 20);
  assert.equal(parsed.resource_work_floor_bits, 173.3897612554174);
  assert.deepEqual(record.effects, [{ claimId: "v2-joint-bank-accounting", status: "verified", metrics: [] }]);
});

test("publishing the October check preserves claim statuses, numerical bounds and model scores", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "october-project-record-"));
  try {
    cpSync(root, temporary, { recursive: true, filter: (source) => source !== path.join(root, "node_modules") });
    rmSync(path.join(temporary, "evidence/official", filename));
    const before = deriveResearchState(temporary);
    const after = deriveResearchState(root);
    assert.deepEqual(after.claims.map((claim) => [claim.id, claim.status, claim.metrics]), before.claims.map((claim) => [claim.id, claim.status, claim.metrics]));
    assert.deepEqual(after.metrics, before.metrics);
    assert.deepEqual(after.modelLeaderboard, before.modelLeaderboard);
    assert.equal(after.records.length, before.records.length + 1);
    assert.ok(after.claims.find((claim) => claim.id === "v2-joint-bank-accounting")?.evidenceIds.includes(record.id));
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
