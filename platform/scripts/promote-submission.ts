import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { derivePlatformState } from "@/lib/derive";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { loadSubmission, verifySubmission } from "@/lib/verifier";
import { option, requiredOption } from "@/scripts/cli";

const root = process.cwd();
const submissionDirectory = path.resolve(requiredOption("--submission"));
const pullRequest = option("--pull-request");
const result = verifySubmission({
  root,
  submissionDirectory,
  context: {
    repository: requiredOption("--repository"),
    commit: requiredOption("--commit"),
    actor: requiredOption("--actor"),
    ...(pullRequest ? { pullRequest: Number(pullRequest) } : {})
  }
});
if (result.status !== "accepted") throw new Error(`submission cannot be promoted: ${result.status}`);
const record = evidenceFromAcceptedResult(loadSubmission(submissionDirectory), result);
const ledgerDirectory = path.join(root, "ledger/accepted");
const recordPath = path.join(ledgerDirectory, `${record.id}.json`);
if (existsSync(recordPath)) throw new Error(`evidence record already exists: ${record.id}`);
mkdirSync(ledgerDirectory, { recursive: true });
writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
const state = derivePlatformState(root);
writeFileSync(path.join(root, "public/data/state.json"), `${JSON.stringify(state, null, 2)}\n`, { flag: "w" });
process.stdout.write(`${recordPath}\n`);
