import type { EvidenceEffect, EvidenceRecord, SubmissionManifest, VerificationResult } from "@/lib/types";

function effectsFor(result: VerificationResult): EvidenceEffect[] {
  if (result.trackId === "certificate-reproduction") {
    return [
      {
        claimId: "production-profile-snapshot",
        status: "verified",
        metrics: []
      }
    ];
  }
  if (result.trackId === "poseidon2b-nonlinear-subspace-reproduction") {
    return [
      {
        claimId: "poseidon2b-classical-audit",
        status: "verified",
        metrics: []
      }
    ];
  }
  throw new Error(`track ${result.trackId} does not support automatic promotion`);
}

export function evidenceFromAcceptedResult(
  manifest: SubmissionManifest,
  result: VerificationResult
): EvidenceRecord {
  if (result.status !== "accepted") throw new Error("only an accepted result can be promoted");
  const context = result.context;
  const researcher = context.researcher;
  const commitUrl = `https://github.com/${context.repository}/commit/${context.commit}`;
  return {
    schemaVersion: 1,
    id: `${manifest.id}-${context.commit.slice(0, 12)}`,
    recordType: "accepted-submission",
    trackId: result.trackId,
    acceptedAt: result.checkedAt,
    title: manifest.title,
    note: manifest.note,
    attribution: manifest.attribution,
    source: {
      repository: context.repository,
      commit: context.commit,
      url: context.pullRequest
        ? `https://github.com/${context.repository}/pull/${context.pullRequest}`
        : commitUrl,
      authorLogin: researcher?.login ?? context.actor,
      authorUrl: researcher?.profileUrl ?? `https://github.com/${context.actor}`,
      avatarUrl: researcher?.avatarUrl ?? `https://avatars.githubusercontent.com/${context.actor}`,
      ...(context.pullRequest ? { pullRequest: context.pullRequest } : {})
    },
    verification: {
      verifier: result.verifier,
      verifierVersion: result.verifierVersion,
      resultDigest: result.resultDigest,
      status: "accepted"
    },
    effects: effectsFor(result)
  };
}
