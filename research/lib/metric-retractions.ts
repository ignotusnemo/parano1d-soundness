import type { EvidenceRecord } from "@/lib/types";

export function metricKey(recordId: string, metricId: string): string {
  return `${recordId}:${metricId}`;
}

/** Corrections are protected official publications, never mutable signed submissions. */
export function validateMetricRetractions(records: EvidenceRecord[]): void {
  const byId = new Map(records.map((record) => [record.id, record]));
  const withdrawn = new Set<string>();
  for (const record of records) {
    if (!record.metricRetractions?.length) continue;
    if (record.recordType !== "official-baseline" || record.trackId !== "official-certificate") throw new Error("only an official certificate may retract a metric");
    for (const retraction of record.metricRetractions) {
      const target = byId.get(retraction.recordId);
      if (!target || Date.parse(target.acceptedAt) >= Date.parse(record.acceptedAt)) throw new Error("metric retraction must name an earlier evidence record");
      if (!target.effects.some((effect) => effect.metrics.some((metric) => metric.id === retraction.metricId))) throw new Error("metric retraction names a missing metric");
      const key = metricKey(retraction.recordId, retraction.metricId);
      if (withdrawn.has(key)) throw new Error("duplicate metric retraction");
      withdrawn.add(key);
    }
  }
}

export function effectiveMetricRecords(records: EvidenceRecord[]): EvidenceRecord[] {
  const withdrawn = new Set(records.flatMap((record) => (record.metricRetractions ?? []).map((item) => metricKey(item.recordId, item.metricId))));
  return records.map((record) => ({
    ...record,
    effects: record.effects.map((effect) => ({ ...effect, metrics: effect.metrics.filter((metric) => !withdrawn.has(metricKey(record.id, metric.id))) }))
  }));
}
