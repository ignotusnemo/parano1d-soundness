import assert from "node:assert/strict";
import test from "node:test";
import { buildFrontier, FRONTIER_MODELS } from "@/lib/frontier";
import type { EvidenceRecord, Metric } from "@/lib/types";

function metric(id: string, value: string, kind: Metric["kind"]): Metric {
  return { id, value, kind, label: id, unit: "bits", scope: "test" };
}

function record(id: string, acceptedAt: string, metrics: Metric[]): EvidenceRecord {
  return {
    schemaVersion: 1,
    id,
    recordType: id === "baseline" ? "official-baseline" : "accepted-submission",
    trackId: "test-track",
    acceptedAt,
    title: id,
    note: "test",
    attribution: { mode: "human" },
    source: { repository: "test/repo", commit: id.padEnd(40, "0"), url: "https://example.com", authorLogin: "test", authorUrl: "https://example.com", avatarUrl: "https://example.com/a.png" },
    verification: { verifier: "test", verifierVersion: "1", resultDigest: id.padEnd(64, "0"), status: "accepted" },
    effects: [{ claimId: "ideal-category-one-bound", status: "proved", metrics }]
  };
}

test("frontier keeps the strongest accepted lower and upper bounds", () => {
  const model = FRONTIER_MODELS[0]!;
  const records = [
    record("baseline", "2026-01-01T00:00:00Z", [metric("category-one.gate-depth-floor", "171", "lower-bound")]),
    record("proof", "2026-01-02T00:00:00Z", [metric("category-one.gate-depth-floor", "173", "lower-bound")]),
    record("weaker-proof", "2026-01-03T00:00:00Z", [metric("category-one.gate-depth-floor", "172", "lower-bound")]),
    record("attack", "2026-01-04T00:00:00Z", [metric("category-one.attack-gate-depth-upper", "210", "upper-bound")]),
    record("better-attack", "2026-01-05T00:00:00Z", [metric("category-one.attack-gate-depth-upper", "205", "upper-bound")])
  ];
  const frontier = buildFrontier(records, model);
  assert.equal(frontier.lower, 173);
  assert.equal(frontier.upper, 205);
  assert.equal(frontier.events.length, 4);
  assert.equal(frontier.inconsistent, false);
});

test("frontier exposes a contradiction instead of hiding a crossed interval", () => {
  const model = FRONTIER_MODELS[0]!;
  const records = [
    record("baseline", "2026-01-01T00:00:00Z", [metric("category-one.gate-depth-floor", "173", "lower-bound")]),
    record("attack", "2026-01-02T00:00:00Z", [metric("category-one.attack-gate-depth-upper", "170", "upper-bound")])
  ];
  assert.equal(buildFrontier(records, model).inconsistent, true);
});

test("a conjectured comparison is never treated as an accepted bound or frontier move", () => {
  const model = FRONTIER_MODELS.find((candidate) => candidate.id === "classical-fs-fri")!;
  const records = [
    record("baseline", "2026-01-01T00:00:00Z", [
      metric("fs-fri.provable-work", "127.194502224322", "lower-bound"),
      metric("fs-fri.conjectured-work", "127.207518749639", "reference")
    ])
  ];
  const frontier = buildFrontier(records, model);
  assert.equal(frontier.lower, 127.194502224322);
  assert.equal(frontier.upper, undefined);
  assert.equal(frontier.reference, 127.207518749639);
  assert.deepEqual(frontier.events[0]?.moves.map((move) => move.metricId), ["fs-fri.provable-work"]);
});
