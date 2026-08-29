import type {
  ClaimStatus,
  DerivedClaim,
  EvidenceRecord,
  LeaderboardEntry,
  Metric,
  PlatformState,
  TrackDefinition
} from "@/lib/types";
import { loadCatalog } from "@/lib/catalog";

const PRODUCTION_REVISION = "fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0";
const CERTIFICATE_REVISION = "c3ea3342fbe27111c84046613010f14f13b917c6";

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
      if (!claim.derived) claim.status = effect.status;
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
    for (const dependency of required) resolve(dependency.claimId);
    if (claim.derived) {
      const dependencies = required.map((dependency) => claims.get(dependency.claimId)!);
      if (dependencies.some((dependency) => dependency.status === "refuted")) {
        claim.status = "refuted";
      } else if (dependencies.every((dependency) => dependency.status === "verified")) {
        claim.status = "verified";
      } else {
        claim.status = "conditional";
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
    if (candidate.status === "verified") continue;
    if (path.has(candidate.id)) throw new Error(`claim dependency cycle at ${candidate.id}`);
    if (candidate.derived && candidate.blockingClaims.length > 0) {
      for (const blocker of candidate.blockingClaims) blockers.add(blocker);
      continue;
    }
    blockers.add(candidate.id);
  }
  return [...blockers].sort();
}

function mergeMetrics(existing: Metric[], additions: Metric[]): Metric[] {
  const metrics = new Map(existing.map((metric) => [metric.id, metric]));
  for (const metric of additions) metrics.set(metric.id, metric);
  return [...metrics.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function leaderboard(records: EvidenceRecord[], tracks: TrackDefinition[]): LeaderboardEntry[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
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
      lastAcceptedAt: record.acceptedAt
    };
    entry.accepted += 1;
    if (track.kind === "proof") entry.proofs += 1;
    if (track.kind === "attack") entry.attacks += 1;
    if (track.kind === "audit") entry.audits += 1;
    if (track.kind === "reproduction") entry.reproductions += 1;
    if (record.acceptedAt > entry.lastAcceptedAt) entry.lastAcceptedAt = record.acceptedAt;
    entries.set(source.authorLogin, entry);
  }
  return [...entries.values()].sort(
    (left, right) => right.accepted - left.accepted || left.login.localeCompare(right.login)
  );
}

export function derivePlatformState(root: string): PlatformState {
  const catalog = loadCatalog(root);
  const claims = deriveClaims(catalog.records, catalog.claims);
  const conclusion = claims.find((claim) => claim.id === "production-category-one");
  if (!conclusion) throw new Error("missing production conclusion claim");
  const headlineMetricIds = new Set([
    "category-one.gate-depth-floor",
    "category-one.ideal-envelope",
    "qrom.sequential-boundary",
    "fs-fri.provable-work"
  ]);
  const metrics = claims.flatMap((claim) => claim.metrics).filter((metric) => headlineMetricIds.has(metric.id));
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
      blockingClaims: conclusion.blockingClaims
    },
    metrics,
    claims,
    tracks: catalog.tracks,
    records: [...catalog.records].sort((left, right) => right.acceptedAt.localeCompare(left.acceptedAt)),
    leaderboard: leaderboard(catalog.records, catalog.tracks),
    pending: []
  };
}

export function statusLabel(status: ClaimStatus): string {
  return status.toUpperCase();
}
