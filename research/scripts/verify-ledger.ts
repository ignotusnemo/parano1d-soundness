import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { canonicalJson } from "@/lib/canonical-json";
import { loadTrack } from "@/lib/catalog";
import { DELEGATION_FILE_NAME, serviceDelegationActor } from "@/lib/delegation";
import { jsonFiles, readStrictJsonFile } from "@/lib/files";
import { verifyGitHubPullRequestContext, verifyGitHubReviewApprovals } from "@/lib/github-review";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { evidenceFromReviewedDecision } from "@/lib/review";
import { evidenceRecordSchema, reviewDecisionSchema } from "@/lib/schemas";
import { loadSubmission, verifySubmission } from "@/lib/verifier";

function contextFromRecord(
  record: ReturnType<typeof evidenceRecordSchema.parse>,
  submissionDirectory: string,
  keyDirectory: string
) {
  const actor = existsSync(path.join(submissionDirectory, DELEGATION_FILE_NAME))
    ? serviceDelegationActor(submissionDirectory, keyDirectory)
    : record.source.authorLogin;
  return {
    repository: record.source.repository,
    commit: record.source.commit,
    actor,
    ...(record.source.pullRequest ? { pullRequest: record.source.pullRequest } : {})
  };
}

function submissionDirectories(root: string): string[] {
  const directory = path.join(root, "submissions");
  return readdirSync(directory)
    .filter((name) => name !== "examples")
    .map((name) => path.join(directory, name))
    .filter((candidate) => statSync(candidate).isDirectory() && existsSync(path.join(candidate, "submission.json")));
}

async function main(): Promise<void> {
  const root = process.cwd();
  const ledgerDirectory = path.join(root, "ledger/accepted");
  if (!existsSync(ledgerDirectory)) {
    process.stdout.write("accepted ledger is empty\n");
    return;
  }
  const verifyGitHub = process.argv.includes("--github");
  const token = process.env.GITHUB_TOKEN;
  if (verifyGitHub && !token) throw new Error("GITHUB_TOKEN is required with --github");
  const submissions = submissionDirectories(root);

  for (const filePath of jsonFiles(ledgerDirectory)) {
    const record = evidenceRecordSchema.parse(readStrictJsonFile(filePath));
    if (record.recordType !== "accepted-submission") throw new Error(`ledger file ${filePath} is not a public submission`);
    const reviewPath = path.join(root, "reviews/accepted", `${record.id}.json`);
    let expected;
    if (existsSync(reviewPath)) {
      const decision = reviewDecisionSchema.parse(readStrictJsonFile(reviewPath));
      const submissionDirectory = path.join(root, "submissions", decision.submissionId);
      if (!existsSync(path.join(submissionDirectory, "submission.json"))) throw new Error(`reviewed submission ${decision.submissionId} is missing`);
      const manifest = loadSubmission(submissionDirectory);
      const track = loadTrack(root, manifest.track);
      const { researcher: _signedResearcher, ...eventContext } = decision.context;
      const result = verifySubmission({ root, submissionDirectory, context: eventContext, checkedAt: decision.verificationCheckedAt });
      expected = evidenceFromReviewedDecision(manifest, result, track, decision);
      if (verifyGitHub) await verifyGitHubReviewApprovals(decision, token!);
    } else {
      const submissionDirectory = submissions.find((candidate) => {
        const manifest = loadSubmission(candidate);
        return record.id === `${manifest.id}-${record.source.commit.slice(0, 12)}`;
      });
      if (!submissionDirectory) throw new Error(`automatic submission for ledger record ${record.id} is missing`);
      const manifest = loadSubmission(submissionDirectory);
      const result = verifySubmission({
        root,
        submissionDirectory,
        context: contextFromRecord(record, submissionDirectory, path.join(root, "keys")),
        checkedAt: record.acceptedAt
      });
      expected = evidenceFromAcceptedResult(manifest, result);
      if (verifyGitHub) await verifyGitHubPullRequestContext(result.context, token!);
    }
    if (canonicalJson(expected) !== canonicalJson(record)) throw new Error(`ledger record ${record.id} differs from its verified source`);
    process.stdout.write(`verified ${record.id}\n`);
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
