import { writeFileSync } from "node:fs";
import path from "node:path";
import { loadTrack } from "@/lib/catalog";
import { readStrictJsonFile } from "@/lib/files";
import { validateReviewDecision } from "@/lib/review";
import { effectSchema, manualAuditPayloadSchema, reviewDecisionSchema } from "@/lib/schemas";
import { loadSubmission, verifySubmission } from "@/lib/verifier";
import { option, options, requiredOption } from "@/scripts/cli";
import type { ReviewApproval } from "@/lib/types";

function approval(value: string, role: ReviewApproval["role"]): ReviewApproval {
  const separator = value.indexOf("=");
  if (separator <= 0 || separator === value.length - 1) throw new Error(`reviewer must use login=https://github.com/... format: ${value}`);
  return { login: value.slice(0, separator), role, reviewUrl: value.slice(separator + 1) };
}

const root = process.cwd();
const submissionDirectory = path.resolve(requiredOption("--submission"));
const manifest = loadSubmission(submissionDirectory);
const track = loadTrack(root, manifest.track);
if (track.validator !== "manual-audit") throw new Error("review decisions apply only to human-reviewed tracks");
const payload = manualAuditPayloadSchema.parse(manifest.payload);
if (payload.finding === "inconclusive") throw new Error("an inconclusive submission cannot be prepared for promotion");
const verificationCheckedAt = option("--checked-at") ?? new Date().toISOString();
const acceptedAt = option("--accepted-at") ?? new Date().toISOString();
const pullRequest = Number(requiredOption("--pull-request"));
if (!Number.isSafeInteger(pullRequest) || pullRequest <= 0) throw new Error("--pull-request must be a positive integer");
const context = {
  repository: requiredOption("--repository"),
  commit: requiredOption("--commit"),
  actor: requiredOption("--actor"),
  pullRequest
};
const result = verifySubmission({ root, submissionDirectory, context, checkedAt: verificationCheckedAt });
if (result.status !== "pending-review") throw new Error(`submission cannot enter review promotion: ${result.status}`);
const effectsPath = option("--effects");
const findingStatuses = track.reviewPolicy?.statusRules[payload.finding];
if (!findingStatuses?.[0]) throw new Error(`track has no status rule for ${payload.finding}`);
const effects = effectsPath
  ? effectSchema.array().min(1).parse(readStrictJsonFile(path.resolve(effectsPath)))
  : [{
      claimId: track.targetClaimId,
      status: findingStatuses[0],
      metrics: []
    }];
const decision = reviewDecisionSchema.parse({
  schemaVersion: 1,
  id: `${manifest.id}-${context.commit.slice(0, 12)}`,
  submissionId: manifest.id,
  trackId: manifest.track,
  acceptedAt,
  verificationCheckedAt,
  verificationResultDigest: result.resultDigest,
  note: requiredOption("--note"),
  context,
  reviewers: [
    ...options("--maintainer").map((value) => approval(value, "maintainer")),
    ...options("--independent").map((value) => approval(value, "independent"))
  ],
  effects
});
validateReviewDecision(manifest, result, track, decision);
const destination = path.resolve(requiredOption("--output"));
writeFileSync(destination, `${JSON.stringify(decision, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${destination}\nverification result ${result.resultDigest}\n`);
