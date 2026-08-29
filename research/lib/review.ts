import { digestCanonicalJson, canonicalJson } from "@/lib/canonical-json";
import { manualAuditPayloadSchema } from "@/lib/schemas";
import type {
  EvidenceRecord,
  ReviewDecision,
  SubmissionManifest,
  TrackDefinition,
  VerificationResult
} from "@/lib/types";

function requireCondition(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type MetricValueFormat = NonNullable<TrackDefinition["reviewPolicy"]>["metricRules"][number]["valueFormat"];

function matchesValueFormat(value: string, format: MetricValueFormat): boolean {
  if (format === "non-negative-integer") return /^(?:0|[1-9][0-9]*)$/u.test(value);
  if (format === "non-negative-decimal") return /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(value);
  return /^(?:0(?:\.[0-9]+)?|1(?:\.0+)?)$/u.test(value);
}

function sourceFor(result: VerificationResult) {
  const context = result.context;
  const researcher = context.researcher;
  const commitUrl = `https://github.com/${context.repository}/commit/${context.commit}`;
  return {
    repository: context.repository,
    commit: context.commit,
    url: context.pullRequest
      ? `https://github.com/${context.repository}/pull/${context.pullRequest}`
      : commitUrl,
    authorLogin: researcher?.login ?? context.actor,
    authorUrl: researcher?.profileUrl ?? `https://github.com/${context.actor}`,
    avatarUrl: researcher?.avatarUrl ?? `https://avatars.githubusercontent.com/${context.actor}`,
    ...(context.pullRequest ? { pullRequest: context.pullRequest } : {})
  };
}

export function validateReviewDecision(
  manifest: SubmissionManifest,
  result: VerificationResult,
  track: TrackDefinition,
  decision: ReviewDecision
): void {
  requireCondition(track.validator === "manual-audit", "only a manual review track accepts a review decision");
  requireCondition(result.status === "pending-review", "reviewed promotion requires a pending-review verifier result");
  requireCondition(Boolean(track.reviewPolicy), "review track has no frozen review policy");
  requireCondition(manifest.id === decision.submissionId, "review decision targets another submission");
  requireCondition(manifest.track === decision.trackId && result.trackId === decision.trackId, "review decision targets another track");
  requireCondition(decision.id === `${manifest.id}-${decision.context.commit.slice(0, 12)}`, "review decision identifier is not canonical");
  requireCondition(decision.verificationCheckedAt === result.checkedAt, "review decision verifier timestamp differs from the checked result");
  requireCondition(decision.verificationResultDigest === result.resultDigest, "review decision does not bind the checked verifier result");
  requireCondition(canonicalJson(decision.context) === canonicalJson(result.context), "review decision context differs from the checked result");
  requireCondition(Date.parse(decision.acceptedAt) >= Date.parse(decision.verificationCheckedAt), "review acceptance predates automated verification");

  const payload = manualAuditPayloadSchema.parse(manifest.payload);
  if (payload.finding === "inconclusive") {
    requireCondition(decision.effects.length === 0, "an inconclusive result cannot change a claim or frontier");
  } else {
    requireCondition(decision.effects.length > 0, `${payload.finding} evidence requires at least one reviewed effect`);
  }

  const submitterLogin = decision.context.researcher?.login ?? decision.context.actor;
  const logins = new Set<string>();
  const reviewUrls = new Set<string>();
  for (const reviewer of decision.reviewers) {
    requireCondition(!logins.has(reviewer.login), `reviewer ${reviewer.login} is duplicated`);
    requireCondition(!reviewUrls.has(reviewer.reviewUrl), `review URL ${reviewer.reviewUrl} is duplicated`);
    requireCondition(reviewer.login !== submitterLogin, "the submission author cannot approve the same submission");
    logins.add(reviewer.login);
    reviewUrls.add(reviewer.reviewUrl);
  }

  const policy = track.reviewPolicy!;
  const maintainers = decision.reviewers.filter((reviewer) => reviewer.role === "maintainer");
  const independent = decision.reviewers.filter((reviewer) => reviewer.role === "independent");
  const minimumApprovals = payload.finding === "inconclusive" ? 1 : policy.minimumApprovals;
  const minimumIndependentApprovals = payload.finding === "inconclusive" ? 0 : policy.minimumIndependentApprovals;
  requireCondition(decision.reviewers.length >= minimumApprovals, `review decision requires ${minimumApprovals} approvals`);
  requireCondition(independent.length >= minimumIndependentApprovals, `review decision requires ${minimumIndependentApprovals} independent approvals`);
  requireCondition(maintainers.some((reviewer) => policy.maintainerLogins.includes(reviewer.login)), "review decision has no approved maintainer");
  requireCondition(maintainers.every((reviewer) => policy.maintainerLogins.includes(reviewer.login)), "maintainer role was assigned to an untrusted login");
  requireCondition(independent.every((reviewer) => !policy.maintainerLogins.includes(reviewer.login)), "a maintainer cannot satisfy an independent review slot");

  const metricRules = new Map(policy.metricRules.map((rule) => [rule.id, rule]));
  const effectClaims = new Set<string>();
  const metricIds = new Set<string>();
  for (const effect of decision.effects) {
    requireCondition(effect.claimId === track.targetClaimId, `review effect may only target ${track.targetClaimId}`);
    requireCondition(!effectClaims.has(effect.claimId), `review effect for ${effect.claimId} is duplicated`);
    effectClaims.add(effect.claimId);
    const permittedStatuses = policy.statusRules[payload.finding as "supports" | "challenges"];
    requireCondition(permittedStatuses.some((status) => status === effect.status), `${payload.finding} evidence cannot assign status ${effect.status} under this track contract`);
    for (const metric of effect.metrics) {
      const rule = metricRules.get(metric.id);
      requireCondition(Boolean(rule), `metric ${metric.id} is outside the frozen review contract`);
      requireCondition(rule!.kind === metric.kind, `metric ${metric.id} has the wrong bound kind`);
      requireCondition(rule!.unit === metric.unit, `metric ${metric.id} has the wrong unit`);
      requireCondition(!metricIds.has(metric.id), `metric ${metric.id} is duplicated`);
      requireCondition(matchesValueFormat(metric.value, rule!.valueFormat), `metric ${metric.id} does not match ${rule!.valueFormat}`);
      metricIds.add(metric.id);
    }
  }
}

export function evidenceFromReviewedDecision(
  manifest: SubmissionManifest,
  result: VerificationResult,
  track: TrackDefinition,
  decision: ReviewDecision
): EvidenceRecord {
  validateReviewDecision(manifest, result, track, decision);
  return {
    schemaVersion: 1,
    id: decision.id,
    recordType: "accepted-submission",
    trackId: decision.trackId,
    acceptedAt: decision.acceptedAt,
    title: manifest.title,
    note: decision.note,
    attribution: manifest.attribution,
    source: sourceFor(result),
    verification: {
      verifier: "parano1d-soundness-research+github-review",
      verifierVersion: "1.0.0",
      resultDigest: digestCanonicalJson({
        automatedResultDigest: result.resultDigest,
        reviewDecision: decision
      }),
      status: "accepted"
    },
    effects: decision.effects
  };
}
