import path from "node:path";
import { createChallengeSubmission, sealChallengeSubmission } from "@/lib/challenge";
import { loadCatalog } from "@/lib/catalog";
import { option, requiredOption } from "@/scripts/cli";
import { verifySubmission } from "@/lib/verifier";
import type { ResearchAttribution } from "@/lib/types";

const root = path.resolve(option("--root") ?? process.cwd());
const command = process.argv[2];

function attribution(): ResearchAttribution {
  if (process.argv.includes("--human")) return { mode: "human" };
  return {
    mode: "ai-assisted",
    model: {
      provider: requiredOption("--model-provider"),
      model: requiredOption("--model-id"),
      displayName: requiredOption("--model-name"),
      ...(option("--agent") ? { agent: option("--agent") } : {})
    }
  };
}

function submissionDirectory(): string {
  return path.resolve(requiredOption("--submission"));
}

if (command === "list") {
  const tracks = loadCatalog(root).tracks.filter((track) => track.state === "active" && track.id !== "official-certificate");
  for (const track of tracks) process.stdout.write(`${track.id}\t${track.kind}\t${track.direction}\t${track.title}\n`);
} else if (command === "setup") {
  const id = requiredOption("--id");
  const destination = path.resolve(option("--output") ?? path.join(root, "submissions", id));
  const files = createChallengeSubmission({ root, destination, id, trackId: requiredOption("--track"), attribution: attribution() });
  process.stdout.write(`Created ${destination}\n`);
  for (const file of files) process.stdout.write(`  ${file}\n`);
  process.stdout.write(`\nGive challenges/${requiredOption("--track")}/AGENT_TASK.md to your agent. After editing, run:\n`);
  process.stdout.write("For reviewed work, change payload.finding from inconclusive to supports or challenges only when the report justifies that effect.\n");
  process.stdout.write(`npm run challenge -- seal --submission ${destination}\n`);
  process.stdout.write(`npm run challenge -- verify --submission ${destination}\n`);
} else if (command === "seal") {
  const directory = submissionDirectory();
  sealChallengeSubmission(directory);
  process.stdout.write(`Sealed passive report and artifact digests in ${directory}/submission.json\n`);
} else if (command === "verify") {
  const directory = submissionDirectory();
  const result = verifySubmission({
    root,
    submissionDirectory: directory,
    context: {
      repository: "local/autoresearch",
      commit: "0000000000000000000000000000000000000000",
      actor: "local-researcher"
    }
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === "rejected") process.exitCode = 1;
} else {
  throw new Error("usage: npm run challenge -- list | setup | seal | verify");
}
