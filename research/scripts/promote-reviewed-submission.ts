import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readStrictJsonFile } from "@/lib/files";
import { verifyGitHubReviewApprovals } from "@/lib/github-review";
import { evidenceFromReviewedDecision } from "@/lib/review";
import { reviewDecisionSchema } from "@/lib/schemas";
import { loadTrack } from "@/lib/catalog";
import { loadSubmission, verifySubmission } from "@/lib/verifier";
import { option, requiredOption } from "@/scripts/cli";

async function main(): Promise<void> {
  const root = process.cwd();
  const outputRootOption = option("--output-root");
  const outputRoot = outputRootOption ? path.resolve(outputRootOption) : root;
  const submissionDirectory = path.resolve(requiredOption("--submission"));
  const decisionSource = path.resolve(requiredOption("--decision"));
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required to verify live GitHub approvals");
  const decision = reviewDecisionSchema.parse(readStrictJsonFile(decisionSource));
  const manifest = loadSubmission(submissionDirectory);
  const track = loadTrack(root, manifest.track);
  const { researcher: _signedResearcher, ...eventContext } = decision.context;
  const result = verifySubmission({
    root,
    submissionDirectory,
    context: eventContext,
    checkedAt: decision.verificationCheckedAt
  });
  const record = evidenceFromReviewedDecision(manifest, result, track, decision, path.join(root, "review-keys"));
  await verifyGitHubReviewApprovals(decision, token);

  const reviewDirectory = path.join(outputRoot, "reviews/accepted");
  const ledgerDirectory = path.join(outputRoot, "ledger/accepted");
  const decisionPath = path.join(reviewDirectory, `${decision.id}.json`);
  const recordPath = path.join(ledgerDirectory, `${record.id}.json`);
  if (existsSync(decisionPath) || existsSync(recordPath)) throw new Error(`reviewed evidence already exists: ${record.id}`);
  mkdirSync(reviewDirectory, { recursive: true });
  mkdirSync(ledgerDirectory, { recursive: true });
  writeFileSync(decisionPath, `${JSON.stringify(decision, null, 2)}\n`, { flag: "wx" });
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${decisionPath}\n${recordPath}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
