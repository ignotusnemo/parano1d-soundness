import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deriveResearchState } from "@/lib/derive";
import { readStrictJsonFile } from "@/lib/files";
import { verifyGitHubReviewApprovals } from "@/lib/github-review";
import { evidenceFromReviewedDecision } from "@/lib/review";
import { reviewDecisionSchema } from "@/lib/schemas";
import { loadTrack } from "@/lib/catalog";
import { loadSubmission, verifySubmission } from "@/lib/verifier";
import { requiredOption } from "@/scripts/cli";

async function main(): Promise<void> {
  const root = process.cwd();
  const submissionDirectory = path.resolve(requiredOption("--submission"));
  const decisionSource = path.resolve(requiredOption("--decision"));
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required to verify live GitHub approvals");
  const decision = reviewDecisionSchema.parse(readStrictJsonFile(decisionSource));
  const manifest = loadSubmission(submissionDirectory);
  const track = loadTrack(root, manifest.track);
  const result = verifySubmission({
    root,
    submissionDirectory,
    context: decision.context,
    checkedAt: decision.verificationCheckedAt
  });
  const record = evidenceFromReviewedDecision(manifest, result, track, decision);
  await verifyGitHubReviewApprovals(decision, token);

  const reviewDirectory = path.join(root, "reviews/accepted");
  const ledgerDirectory = path.join(root, "ledger/accepted");
  const decisionPath = path.join(reviewDirectory, `${decision.id}.json`);
  const recordPath = path.join(ledgerDirectory, `${record.id}.json`);
  if (existsSync(decisionPath) || existsSync(recordPath)) throw new Error(`reviewed evidence already exists: ${record.id}`);
  mkdirSync(reviewDirectory, { recursive: true });
  mkdirSync(ledgerDirectory, { recursive: true });
  writeFileSync(decisionPath, `${JSON.stringify(decision, null, 2)}\n`, { flag: "wx" });
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  const state = deriveResearchState(root);
  writeFileSync(path.join(root, "public/data/state.json"), `${JSON.stringify(state, null, 2)}\n`, { flag: "w" });
  process.stdout.write(`${decisionPath}\n${recordPath}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
