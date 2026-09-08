import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { verifyForgejoPullRequestContext } from "@/lib/forgejo-review";
import { verifyGitHubPullRequestContext } from "@/lib/github-review";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { loadSubmission, verifySubmission } from "@/lib/verifier";
import { option, requiredOption } from "@/scripts/cli";

async function main(): Promise<void> {
  const root = process.cwd();
  const submissionDirectory = path.resolve(requiredOption("--submission"));
  const pullRequest = option("--pull-request");
  if (!pullRequest || !/^[1-9][0-9]*$/u.test(pullRequest)) throw new Error("--pull-request must be a positive integer");
  const context = {
    repository: requiredOption("--repository"),
    commit: requiredOption("--commit"),
    actor: requiredOption("--actor"),
    pullRequest: Number(pullRequest)
  };
  const result = verifySubmission({ root, submissionDirectory, context });
  if (result.status !== "accepted") throw new Error(`submission cannot be promoted: ${result.status}`);
  if (result.context.researcher?.identityProvider === "noid.network") {
    await verifyForgejoPullRequestContext(result.context);
  } else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is required to verify a legacy GitHub pull request identity");
    await verifyGitHubPullRequestContext(result.context, token);
  }
  const record = evidenceFromAcceptedResult(loadSubmission(submissionDirectory), result);
  const ledgerDirectory = path.join(root, "ledger/accepted");
  const recordPath = path.join(ledgerDirectory, `${record.id}.json`);
  if (existsSync(recordPath)) throw new Error(`evidence record already exists: ${record.id}`);
  mkdirSync(ledgerDirectory, { recursive: true });
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${recordPath}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
