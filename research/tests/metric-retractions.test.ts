import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadCatalog } from "@/lib/catalog";
import { deriveResearchState } from "@/lib/derive";
import { buildFrontier, FRONTIER_MODELS } from "@/lib/frontier";
import { effectiveMetricRecords, validateMetricRetractions } from "@/lib/metric-retractions";
import { evidenceRecordSchema } from "@/lib/schemas";
import type { EvidenceRecord } from "@/lib/types";

const catalog = () => loadCatalog(path.resolve("."));
const responseModel = FRONTIER_MODELS.find((model) => model.id === "coherent-response")!;

test("the corrected construction replaces invalid subtotals while Delta's lower bound and evidence remain", () => {
  const records = catalog().records;
  const snapshot = JSON.stringify(records);
  const frontier = buildFrontier(records, responseModel);
  assert.equal(frontier.lower, 7);
  assert.equal(frontier.upper, Math.log2(2008370223960));
  const correction = frontier.events.at(-1)!;
  assert.equal(correction.record.id, "official-certificate-a5c7e117");
  assert.equal(correction.corrected, true);
  assert.ok(frontier.events.some((event) => event.upper === Math.log2(200343274560)));
  const effective = effectiveMetricRecords(records);
  assert.ok(effective.filter((record) => ["official-certificate-c3ea3342", "official-certificate-e45cfefd"].includes(record.id)).every((record) => record.effects.flatMap((effect) => effect.metrics).every((metric) => !metric.id.startsWith("coherent-response."))));
  assert.equal(JSON.stringify(records), snapshot);
  const state = deriveResearchState(path.resolve("."));
  assert.equal(state.claims.find((claim) => claim.id === "coherent-response-schedule")?.metrics.find((metric) => metric.id === "coherent-response.gate-depth")?.value, "2008370223960");
  assert.equal(state.leaderboard.find((entry) => entry.login === "agent-delta")?.frontierMoves, 1);
  assert.equal(state.claims.flatMap((claim) => claim.metrics).find((metric) => metric.id === "category-one.ideal-envelope")?.value, "0.049330348228363684");
});

test("retractions require protected official records and exact earlier metric targets", () => {
  const records = catalog().records;
  const correction = records.find((record) => record.id === "official-certificate-a5c7e117")!;
  const rejected = (mutate: (record: EvidenceRecord) => void, pattern: RegExp) => {
    const changed = structuredClone(correction);
    mutate(changed);
    assert.throws(() => validateMetricRetractions(records.map((record) => record.id === correction.id ? changed : record)), pattern);
  };
  rejected((record) => { record.recordType = "accepted-submission"; }, /only an official/u);
  rejected((record) => { record.metricRetractions![0]!.recordId = "missing-record"; }, /earlier evidence/u);
  rejected((record) => { record.metricRetractions![0]!.metricId = "missing.metric"; }, /missing metric/u);
  rejected((record) => { record.metricRetractions![0]!.recordId = record.id; }, /earlier evidence/u);
  rejected((record) => { record.metricRetractions!.push(record.metricRetractions![0]!); }, /duplicate/u);
  assert.equal(evidenceRecordSchema.safeParse({ ...correction, recordType: "accepted-submission" }).success, false);
});

test("withdrawing the only bound leaves it open; unrelated constructions remain eligible", () => {
  const original = structuredClone(catalog().records.find((record) => record.id === "official-certificate-c3ea3342")!);
  original.effects = original.effects.filter((effect) => effect.claimId === "coherent-response-schedule");
  const replacement: EvidenceRecord = { ...original, id: "test-retraction", acceptedAt: "2026-09-08T23:00:00.000Z", effects: [], metricRetractions: [{ recordId: original.id, metricId: "coherent-response.gate-depth", reason: "Test withdrawal of the incomplete construction." }] };
  assert.equal(buildFrontier([original, replacement], responseModel).upper, undefined);
  const unrelated = structuredClone(original);
  unrelated.id = "unrelated-construction";
  unrelated.acceptedAt = "2026-09-01T00:00:00.000Z";
  unrelated.effects[0]!.metrics.find((metric) => metric.id === "coherent-response.gate-depth")!.value = "1000000000000";
  assert.equal(buildFrontier([original, unrelated, replacement], responseModel).upper, Math.log2(1e12));
});
