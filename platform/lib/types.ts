export const CLAIM_STATUSES = [
  "verified",
  "published",
  "conditional",
  "assumed",
  "open",
  "refuted"
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export type MetricKind =
  | "lower-bound"
  | "upper-bound"
  | "probability-upper-bound"
  | "resource-count"
  | "reference";

export interface Metric {
  id: string;
  label: string;
  value: string;
  unit: string;
  kind: MetricKind;
  scope: string;
  exact?: string;
}

export interface ClaimDependency {
  claimId: string;
  role: "required" | "context";
  note: string;
}

export interface ClaimDefinition {
  id: string;
  title: string;
  statement: string;
  scope: string;
  initialStatus: ClaimStatus;
  derived: boolean;
  dependencies: ClaimDependency[];
  sources: Array<{ label: string; url: string }>;
}

export interface TrackDefinition {
  id: string;
  title: string;
  description: string;
  kind: "proof" | "attack" | "audit" | "reproduction";
  direction: "maximize" | "minimize" | "non-ranked";
  targetClaimId: string;
  contractVersion: string;
  validator: "certificate-reproduction" | "reserved-formal-proof" | "reserved-attack-witness" | "manual-audit";
  state: "active" | "contract-draft";
  acceptance: string;
  contractUrl?: string;
  scoreMetricId?: string;
  expected?: Record<string, string>;
}

export interface EvidenceEffect {
  claimId: string;
  status: ClaimStatus;
  metrics: Metric[];
}

export interface EvidenceSource {
  repository: string;
  commit: string;
  url: string;
  authorLogin: string;
  authorUrl: string;
  avatarUrl: string;
  pullRequest?: number;
}

export interface EvidenceRecord {
  schemaVersion: 1;
  id: string;
  recordType: "official-baseline" | "accepted-submission";
  trackId: string;
  acceptedAt: string;
  title: string;
  note: string;
  source: EvidenceSource;
  verification: {
    verifier: string;
    verifierVersion: string;
    resultDigest: string;
    status: "accepted";
  };
  effects: EvidenceEffect[];
}

export interface SubmissionManifest {
  schemaVersion: 1;
  id: string;
  track: string;
  contractVersion: string;
  title: string;
  note: string;
  payload: Record<string, unknown>;
}

export interface VerificationContext {
  repository: string;
  commit: string;
  actor: string;
  pullRequest?: number;
}

export interface VerificationResult {
  schemaVersion: 1;
  submissionId: string;
  trackId: string;
  status: "accepted" | "rejected" | "pending-review";
  checkedAt: string;
  verifier: string;
  verifierVersion: string;
  reasons: string[];
  observed: Record<string, string>;
  resultDigest: string;
  context: VerificationContext;
}

export interface DerivedClaim extends ClaimDefinition {
  status: ClaimStatus;
  metrics: Metric[];
  evidenceIds: string[];
  blockingClaims: string[];
}

export interface LeaderboardEntry {
  login: string;
  url: string;
  avatarUrl: string;
  accepted: number;
  proofs: number;
  attacks: number;
  audits: number;
  reproductions: number;
  lastAcceptedAt: string;
}

export interface PendingSubmission {
  id: string;
  number: number;
  title: string;
  url: string;
  authorLogin: string;
  authorUrl: string;
  avatarUrl: string;
  updatedAt: string;
  status: "queued" | "checking" | "rejected" | "ready";
}

export interface PlatformState {
  schemaVersion: 1;
  generatedAt: string;
  productionRevision: string;
  certificateRevision: string;
  conclusion: {
    status: ClaimStatus;
    title: string;
    statement: string;
    blockingClaims: string[];
  };
  metrics: Metric[];
  claims: DerivedClaim[];
  tracks: TrackDefinition[];
  records: EvidenceRecord[];
  leaderboard: LeaderboardEntry[];
  pending: PendingSubmission[];
}
