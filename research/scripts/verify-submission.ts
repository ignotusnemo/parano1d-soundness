import path from "node:path";
import { writeFileSync } from "node:fs";
import { option, requiredOption } from "@/scripts/cli";
import { verifySubmission } from "@/lib/verifier";

const root = path.resolve(option("--root") ?? process.cwd());
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
const output = `${JSON.stringify(result, null, 2)}\n`;
const destination = option("--output");
if (destination) writeFileSync(path.resolve(destination), output, { flag: "w" });
process.stdout.write(output);
if (result.status === "rejected") process.exitCode = 1;
