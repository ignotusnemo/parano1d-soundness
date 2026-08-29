import type {
  ClaimStatus,
  DerivedClaim,
  EvidenceRecord,
  LeaderboardEntry,
  Metric,
  ModelLeaderboardEntry,
  PlatformState,
  TrackDefinition
} from "@/lib/types";
import { loadCatalog } from "@/lib/catalog";
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import { exactDecimalDifference } from "@/lib/exact-decimal";
import { buildFrontier, FRONTIER_MODELS } from "@/lib/frontier";

const CATEGORY_ONE_GATE_DEPTH_REFERENCE = "170";

function isEstablished(status: ClaimStatus): boolean {
  return status === "verified" || status === "proved";
}

function mergeDirectStatus(current: ClaimStatus, incoming: ClaimStatus): ClaimStatus {
  if (current === incoming) return current;
  if (current === "conflicted" || incoming === "conflicted") return "conflicted";
  if (current === "under-review") return incoming;
  if (incoming === "under-review") return current;
  if (current === "premise-failed" || incoming === "premise-failed") return "conflicted";
  if (current === "refuted" || incoming === "refuted") {
    const other = current === "refuted" ? incoming : current;
    return other === "premise" ? "refuted" : "conflicted";
  }
  if (current === "premise") return incoming;
  if (incoming === "premise") return current;
  return current === "proved" || incoming === "proved" ? "proved" : "verified";
}

function deriveClaims(records: EvidenceRecord[], definitions: ReturnType<typeof loadCatalog>["claims"]): DerivedClaim[] {
  const claims = new Map<string, DerivedClaim>();
  for (const definition of definitions) {
    claims.set(definition.id, {
      ...definition,
      status: definition.initialStatus,
      metrics: [],
      evidenceIds: [],
      blockingClaims: []
    });
  }

  const sortedRecords = [...records].sort((left, right) => left.acceptedAt.localeCompare(right.acceptedAt));
  for (const record of sortedRecords) {
    for (const effect of record.effects) {
      const claim = claims.get(effect.claimId);
      if (!claim) throw new Error(`effect references missing claim ${effect.claimId}`);
      if (!claim.derived) claim.status = mergeDirectStatus(claim.status, effect.status);
      claim.metrics = mergeMetrics(claim.metrics, effect.metrics);
      claim.evidenceIds.push(record.id);
    }
  }

  const visiting = new Set<string>();
  const resolved = new Set<string>();
  const resolve = (id: string): DerivedClaim => {
    const claim = claims.get(id);
    if (!claim) throw new Error(`missing claim ${id}`);
    if (resolved.has(id)) return claim;
    if (visiting.has(id)) throw new Error(`claim dependency cycle at ${id}`);
    visiting.add(id);
    const required = claim.dependencies.filter((dependency) => dependency.role === "required");
    const declaredPremises = claim.dependencies.filter((dependency) => dependency.role === "premise");
    for (const dependency of [...required, ...declaredPremises]) resolve(dependency.claimId);
    const dependencies = required.map((dependency) => claims.get(dependency.claimId)!);
    const premises = declaredPremises.map((dependency) => claims.get(dependency.claimId)!);
    if (dependencies.some((dependency) => dependency.status === "conflicted") || premises.some((premise) => premise.status === "conflicted")) {
      claim.status = "conflicted";
    } else if (!claim.derived && isEstablished(claim.status) && dependencies.some((dependency) => dependency.status === "refuted")) {
      claim.status = "conflicted";
    } else if (!claim.derived && isEstablished(claim.status) && (dependencies.some((dependency) => dependency.status === "premise-failed") || premises.some((premise) => premise.status === "refuted" || premise.status === "premise-failed"))) {
      claim.status = "premise-failed";
    } else if (!claim.derived && isEstablished(claim.status) && !dependencies.every((dependency) => isEstablished(dependency.status))) {
      claim.status = "under-review";
    }
    if (claim.derived) {
      if (dependencies.some((dependency) => dependency.status === "conflicted") || premises.some((premise) => premise.status === "conflicted")) {
        claim.status = "conflicted";
      } else if (dependencies.some((dependency) => dependency.status === "refuted")) {
        claim.status = "refuted";
      } else if (dependencies.some((dependency) => dependency.status === "premise-failed") || premises.some((premise) => premise.status === "refuted" || premise.status === "premise-failed")) {
        claim.status = "premise-failed";
      } else if (dependencies.every((dependency) => isEstablished(dependency.status))) {
        claim.status = claim.initialStatus === "verified" ? "verified" : "proved";
      } else {
        claim.status = "under-review";
      }
    }
    claim.blockingClaims = collectBlockers(claim, claims, new Set());
    visiting.delete(id);
    resolved.add(id);
    return claim;
  };

  for (const definition of definitions) resolve(definition.id);
  return definitions.map((definition) => claims.get(definition.id)!);
}

function collectBlockers(
  claim: DerivedClaim,
  claims: Map<string, DerivedClaim>,
  path: Set<string>
): string[] {
  const blockers = new Set<string>();
  for (const dependency of claim.dependencies.filter((item) => item.role === "required")) {
    const candidate = claims.get(dependency.claimId)!;
    if (isEstablished(candidate.status)) continue;
    if (path.has(candidate.id)) throw new Error(`claim dependency cycle at ${candidate.id}`);
    if (candidate.derived && candidate.blockingClaims.length > 0) {
      for (const blocker of candidate.blockingClaims) blockers.add(blocker);
      continue;
    }
    blockers.add(candidate.id);
  }
  return [...blockers].sort();
}

function collectPremises(claim: DerivedClaim, claims: Map<string, DerivedClaim>, path: Set<string>): string[] {
  if (path.has(claim.id)) throw new Error(`claim dependency cycle at ${claim.id}`);
  const nextPath = new Set(path).add(claim.id);
  const premises = new Set<string>();
  for (const dependency of claim.dependencies) {
    if (dependency.role === "premise") {
      premises.add(dependency.claimId);
      continue;
    }
    if (dependency.role !== "required") continue;
    const candidate = claims.get(dependency.claimId)!;
    for (const premise of collectPremises(candidate, claims, nextPath)) premises.add(premise);
  }
  return [...premises].sort();
}

function mergeMetrics(existing: Metric[], additions: Metric[]): Metric[] {
  const metrics = new Map(existing.map((metric) => [metric.id, metric]));
  for (const metric of additions) metrics.set(metric.id, metric);
  return [...metrics.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function frontierMoveCounts(records: EvidenceRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const model of FRONTIER_MODELS) {
    for (const event of buildFrontier(records, model).events) {
      counts.set(event.record.id, (counts.get(event.record.id) ?? 0) + event.moves.length);
    }
  }
  return counts;
}

function leaderboard(records: EvidenceRecord[], tracks: TrackDefinition[]): LeaderboardEntry[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const movesByRecord = frontierMoveCounts(records);
  const entries = new Map<string, LeaderboardEntry>();
  for (const record of records.filter((candidate) => candidate.recordType === "accepted-submission")) {
    const track = trackById.get(record.trackId);
    if (!track) continue;
    const source = record.source;
    const entry = entries.get(source.authorLogin) ?? {
      login: source.authorLogin,
      url: source.authorUrl,
      avatarUrl: source.avatarUrl,
      accepted: 0,
      proofs: 0,
      attacks: 0,
      audits: 0,
      reproductions: 0,
      frontierMoves: 0,
      lastAcceptedAt: record.acceptedAt
    };
    entry.accepted += 1;
    if (track.kind === "proof") entry.proofs += 1;
    if (track.kind === "attack") entry.attacks += 1;
    if (track.kind === "audit") entry.audits += 1;
    if (track.kind === "reproduction") entry.reproductions += 1;
    entry.frontierMoves += movesByRecord.get(record.id) ?? 0;
    if (record.acceptedAt > entry.lastAcceptedAt) entry.lastAcceptedAt = record.acceptedAt;
    entries.set(source.authorLogin, entry);
  }
  return [...entries.values()].sort(
    (left, right) => right.frontierMoves - left.frontierMoves || right.accepted - left.accepted || left.login.localeCompare(right.login)
  );
}

function modelLeaderboard(records: EvidenceRecord[], tracks: TrackDefinition[]): ModelLeaderboardEntry[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const movesByRecord = frontierMoveCounts(records);
  const entries = new Map<string, ModelLeaderboardEntry & { researcherLogins: Set<string> }>();
  for (const record of records.filter((candidate) => candidate.recordType === "accepted-submission")) {
    if (record.attribution.mode !== "ai-assisted") continue;
    const track = trackById.get(record.trackId);
    if (!track) continue;
    const model = record.attribution.model;
    const key = `${model.provider}/${model.model}/${model.agent ?? ""}`;
    const entry = entries.get(key) ?? {
      key,
      ...model,
      accepted: 0,
      proofs: 0,
      attacks: 0,
      audits: 0,
      reproductions: 0,
      frontierMoves: 0,
      researchers: 0,
      researcherLogins: new Set<string>(),
      lastAcceptedAt: record.acceptedAt
    };
    entry.accepted += 1;
    if (track.kind === "proof") entry.proofs += 1;
    if (track.kind === "attack") entry.attacks += 1;
    if (track.kind === "audit") entry.audits += 1;
    if (track.kind === "reproduction") entry.reproductions += 1;
    entry.frontierMoves += movesByRecord.get(record.id) ?? 0;
    entry.researcherLogins.add(record.source.authorLogin);
    entry.researchers = entry.researcherLogins.size;
    if (record.acceptedAt > entry.lastAcceptedAt) entry.lastAcceptedAt = record.acceptedAt;
    entries.set(key, entry);
  }
  return [...entries.values()]
    .map(({ researcherLogins: _researcherLogins, ...entry }) => entry)
    .sort((left, right) => right.frontierMoves - left.frontierMoves || right.accepted - left.accepted || left.displayName.localeCompare(right.displayName));
}

export function derivePlatformState(root: string): PlatformState {
  const catalog = loadCatalog(root);
  const claims = deriveClaims(catalog.records, catalog.claims);
  const conclusion = claims.find((claim) => claim.id === "production-category-one");
  if (!conclusion) throw new Error("missing production conclusion claim");
  const headlineMetricIds = [
    "category-one.nist-category",
    "category-one.gate-depth-floor",
    "category-one.margin-over-reference",
    "category-one.ideal-envelope",
  ];
  const allMetrics = claims.flatMap((claim) => claim.metrics);
  const metrics = headlineMetricIds.map((id) => allMetrics.find((metric) => metric.id === id)).filter((metric) => metric !== undefined);
  const gateDepthFloor = metrics.find((metric) => metric.id === "category-one.gate-depth-floor");
  const marginIndex = metrics.findIndex((metric) => metric.id === "category-one.margin-over-reference");
  if (gateDepthFloor && marginIndex !== -1 && metrics[marginIndex]) {
    metrics[marginIndex] = {
      ...metrics[marginIndex],
      value: exactDecimalDifference(gateDepthFloor.value, CATEGORY_ONE_GATE_DEPTH_REFERENCE, true)
    };
  }
  const generatedAt = catalog.records.reduce(
    (latest, record) => (record.acceptedAt > latest ? record.acceptedAt : latest),
    "1970-01-01T00:00:00Z"
  );
  return {
    schemaVersion: 1,
    generatedAt,
    productionRevision: PRODUCTION_REVISION,
    certificateRevision: CERTIFICATE_REVISION,
    conclusion: {
      status: conclusion.status,
      title: conclusion.title,
      statement: conclusion.statement,
      blockingClaims: conclusion.blockingClaims,
      premiseClaims: collectPremises(conclusion, new Map(claims.map((claim) => [claim.id, claim])), new Set())
    },
    metrics,
    claims,
    tracks: catalog.tracks,
    records: [...catalog.records].sort((left, right) => right.acceptedAt.localeCompare(left.acceptedAt)),
    leaderboard: leaderboard(catalog.records, catalog.tracks),
    modelLeaderboard: modelLeaderboard(catalog.records, catalog.tracks),
    pending: []
  };
}

export function statusLabel(status: ClaimStatus): string {
  return status.toUpperCase();
}
