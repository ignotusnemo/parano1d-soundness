import type { EvidenceRecord, Metric } from "@/lib/types";

export interface FrontierMetric {
  id: string;
  scale?: "identity" | "log2";
}

export interface FrontierModel {
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  unit: string;
  axisLabel: string;
  lowerLabel: string;
  upperLabel: string;
  lowerMetrics: FrontierMetric[];
  upperMetrics: FrontierMetric[];
  reference?: {
    value?: number;
    metricId?: string;
    label: string;
    qualification?: string;
  };
}

export interface FrontierMove {
  side: "lower" | "upper";
  metricId: string;
  label: string;
  value: number;
  sourceValue: string;
}

export interface FrontierEvent {
  record: EvidenceRecord;
  lower?: number;
  upper?: number;
  moves: FrontierMove[];
}

export interface Frontier {
  events: FrontierEvent[];
  lower?: number;
  upper?: number;
  reference?: number;
  inconsistent: boolean;
}

export const FRONTIER_MODELS: FrontierModel[] = [
  {
    id: "category-one",
    shortTitle: "End-to-end C1",
    title: "End-to-end Category 1 gate-depth",
    description: "The proved lower frontier is the minimum gate-depth required for invalid terminal State success above one half in the pinned end-to-end game. A concrete end-to-end attack would establish an upper frontier.",
    unit: "bits",
    axisLabel: "log2 logical gate-depth",
    lowerLabel: "Proved soundness lower",
    upperLabel: "Concrete attack upper",
    lowerMetrics: [{ id: "category-one.gate-depth-floor" }],
    upperMetrics: [{ id: "category-one.attack-gate-depth-upper" }],
    reference: { value: 170, label: "NIST Category 1 reference" }
  },
  {
    id: "sequential-qrom",
    shortTitle: "Sequential QROM",
    title: "Sequential ideal-QROM query boundary",
    description: "Proofs raise the largest covered total quantum query budget. A concrete adversary against the same from-genesis invalid-State game would lower the attack upper frontier.",
    unit: "bits",
    axisLabel: "log2 total quantum queries",
    lowerLabel: "Proved query lower",
    upperLabel: "Concrete attack upper",
    lowerMetrics: [{ id: "qrom.sequential-boundary" }],
    upperMetrics: [{ id: "qrom.attack-query-upper" }],
    reference: { value: 64, label: "2^64 evaluated budget" }
  },
  {
    id: "coherent-response",
    shortTitle: "Response circuit",
    title: "Minimum coherent response cost",
    description: "A universal circuit lower bound raises the lower frontier. A cheaper exact reversible construction lowers the upper frontier. Both must implement the frozen production response relation in the same cost model.",
    unit: "bits",
    axisLabel: "log2 logical gate-depth",
    lowerLabel: "Proved universal minimum",
    upperLabel: "Best exact construction",
    lowerMetrics: [{ id: "coherent-response.minimum-gate-depth-lower", scale: "log2" }],
    upperMetrics: [{ id: "coherent-response.gate-depth", scale: "log2" }]
  },
  {
    id: "classical-fs-fri",
    shortTitle: "Classical FS-FRI",
    title: "Provable classical FS-FRI work",
    description: "The result is the solid green proved lower frontier. The gray dashed Block-Tiwari conjecture is a separate literature reference, not a result, and is excluded from the certificate and both frontiers. Only a concrete attack in the same game can establish an upper frontier.",
    unit: "bits",
    axisLabel: "log2 expected random-oracle queries",
    lowerLabel: "Proved result, lower bound",
    upperLabel: "Concrete attack upper",
    lowerMetrics: [{ id: "fs-fri.provable-work" }],
    upperMetrics: [{ id: "fs-fri.attack-work-upper" }],
    reference: {
      metricId: "fs-fri.conjectured-work",
      label: "Block-Tiwari conjecture, not a result",
      qualification: "excluded from the certificate and both frontiers"
    }
  }
];

function metricNumber(metric: Metric, definition: FrontierMetric): number | undefined {
  const raw = Number(metric.value);
  if (!Number.isFinite(raw)) return undefined;
  if (definition.scale === "log2") {
    if (raw <= 0) return undefined;
    return Math.log2(raw);
  }
  return raw;
}

function metricsInRecord(record: EvidenceRecord): Metric[] {
  return record.effects.flatMap((effect) => effect.metrics);
}

function matchingMoves(metrics: Metric[], definitions: FrontierMetric[], side: "lower" | "upper"): FrontierMove[] {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  return metrics.flatMap((metric) => {
    const definition = byId.get(metric.id);
    if (!definition) return [];
    const value = metricNumber(metric, definition);
    if (value === undefined) return [];
    return [{ side, metricId: metric.id, label: metric.label, value, sourceValue: metric.value }];
  });
}

function referenceValue(records: EvidenceRecord[], model: FrontierModel): number | undefined {
  if (!model.reference) return undefined;
  if (model.reference.value !== undefined) return model.reference.value;
  if (!model.reference.metricId) return undefined;
  for (const record of records) {
    const metric = metricsInRecord(record).find((candidate) => candidate.id === model.reference?.metricId);
    if (metric) {
      const value = Number(metric.value);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

export function buildFrontier(records: EvidenceRecord[], model: FrontierModel): Frontier {
  const sorted = [...records].sort((left, right) => left.acceptedAt.localeCompare(right.acceptedAt));
  const events: FrontierEvent[] = [];
  let lower: number | undefined;
  let upper: number | undefined;

  for (const record of sorted) {
    const metrics = metricsInRecord(record);
    const lowerMoves = matchingMoves(metrics, model.lowerMetrics, "lower");
    const upperMoves = matchingMoves(metrics, model.upperMetrics, "upper");
    const effectiveMoves: FrontierMove[] = [];

    for (const move of lowerMoves) {
      if (lower === undefined || move.value > lower) {
        lower = move.value;
        effectiveMoves.push(move);
      }
    }
    for (const move of upperMoves) {
      if (upper === undefined || move.value < upper) {
        upper = move.value;
        effectiveMoves.push(move);
      }
    }
    if (effectiveMoves.length > 0) events.push({ record, lower, upper, moves: effectiveMoves });
  }

  return {
    events,
    lower,
    upper,
    reference: referenceValue(sorted, model),
    inconsistent: lower !== undefined && upper !== undefined && lower > upper
  };
}
