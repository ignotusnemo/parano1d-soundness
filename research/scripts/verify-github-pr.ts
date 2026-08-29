import { Buffer } from "node:buffer";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { verifySubmission } from "@/lib/verifier";

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const commitPattern = /^[0-9a-f]{40}$/;
const loginPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const submissionPath = /^research\/submissions\/([a-z0-9][a-z0-9-]{2,79})\/(submission\.json|report\.md|artifact\.json)$/;
const maximumBytes = 1_048_576;

interface PullRequestFile {
  filename: string;
  status: string;
  sha: string;
}

interface PullRequest {
  base: { sha: string };
  head: { sha: string; repo: { full_name: string } | null };
  user: { login: string } | null;
}

function assertStablePullRequest(pull: PullRequest, base: string, head: string, actor: string): asserts pull is PullRequest & { head: { sha: string; repo: { full_name: string } }; user: { login: string } } {
  if (pull.base.sha !== base) throw new Error("pull request base revision changed during verification");
  if (pull.head.sha !== head) throw new Error("pull request revision changed during verification");
  if (!pull.head.repo || !repositoryPattern.test(pull.head.repo.full_name)) throw new Error("pull request head repository is unavailable");
  if (!pull.user || pull.user.login !== actor) throw new Error("pull request author differs from the trusted event");
}

function requiredEnvironment(name: string, pattern?: RegExp): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  if (pattern && !pattern.test(value)) throw new Error(`${name} is malformed`);
  return value;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function githubJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders(token), cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`GitHub API request failed with ${response.status}`);
  return await response.json() as T;
}

async function blob(repository: string, sha: string, token: string): Promise<Buffer> {
  if (!commitPattern.test(sha)) throw new Error("submission blob id is malformed");
  const result = await githubJson<{ encoding: string; content: string }>(
    `https://api.github.com/repos/${repository}/git/blobs/${sha}`,
    token
  );
  if (result.encoding !== "base64") throw new Error("submission blob is not base64 encoded");
  return Buffer.from(result.content.replaceAll("\n", ""), "base64");
}

async function main(): Promise<void> {
  const repository = requiredEnvironment("SUBMISSION_REPOSITORY", repositoryPattern);
  const pullRequestNumber = Number(requiredEnvironment("SUBMISSION_PULL_REQUEST", /^[1-9][0-9]*$/));
  const base = requiredEnvironment("SUBMISSION_BASE", commitPattern);
  const head = requiredEnvironment("SUBMISSION_HEAD", commitPattern);
  const actor = requiredEnvironment("SUBMISSION_ACTOR", loginPattern);
  const token = requiredEnvironment("GITHUB_TOKEN");
  const apiRoot = `https://api.github.com/repos/${repository}`;
  const pull = await githubJson<PullRequest>(`${apiRoot}/pulls/${pullRequestNumber}`, token);
  assertStablePullRequest(pull, base, head, actor);

  const files = await githubJson<PullRequestFile[]>(`${apiRoot}/pulls/${pullRequestNumber}/files?per_page=100`, token);
  if (files.length === 0 || files.length > 3) throw new Error("a submission pull request must add one, two or three passive data files");
  let id: string | undefined;
  const selected: Array<{ name: string; content: Buffer }> = [];
  let totalBytes = 0;
  for (const file of files) {
    const match = submissionPath.exec(file.filename);
    if (file.status !== "added" || !match || !match[1] || !match[2]) {
      throw new Error("pull request contains a path outside the passive submission contract");
    }
    id ??= match[1];
    if (id !== match[1]) throw new Error("one pull request may add exactly one submission directory");
    const content = await blob(pull.head.repo.full_name, file.sha, token);
    totalBytes += content.byteLength;
    if (totalBytes > maximumBytes) throw new Error(`submission exceeds ${maximumBytes} bytes`);
    selected.push({ name: match[2], content });
  }
  if (!id) throw new Error("submission directory was not found");
  const stablePull = await githubJson<PullRequest>(`${apiRoot}/pulls/${pullRequestNumber}`, token);
  assertStablePullRequest(stablePull, base, head, actor);
  if (stablePull.head.repo.full_name !== pull.head.repo.full_name) throw new Error("pull request head repository changed during verification");

  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "parano1d-submission-"));
  try {
    const directory = path.join(temporaryRoot, id);
    mkdirSync(directory, { recursive: true });
    for (const file of selected) writeFileSync(path.join(directory, file.name), file.content, { flag: "wx" });
    const result = verifySubmission({
      root: process.cwd(),
      submissionDirectory: directory,
      context: { repository, commit: head, actor, pullRequest: pullRequestNumber }
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `verification_status=${result.status}\n`);
    if (result.status === "rejected") process.exitCode = 1;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
