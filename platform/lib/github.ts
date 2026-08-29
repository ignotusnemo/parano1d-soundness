import type { PendingSubmission } from "@/lib/types";

interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  draft: boolean;
  head: { sha: string };
  user: { login: string; html_url: string; avatar_url: string } | null;
  labels: Array<{ name: string }>;
}

interface GitHubPullRequestFile {
  filename: string;
  status: "added" | "changed" | "removed" | "renamed" | "copied" | "unchanged";
}

interface GitHubCommitStatus {
  context: string;
  state: "error" | "failure" | "pending" | "success";
}

let cache: { repository: string; expiresAt: number; value: PendingSubmission[] } | undefined;

function headers(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  };
}

async function isSubmissionPullRequest(repository: string, pull: GitHubPullRequest): Promise<boolean> {
  if (pull.labels.some((label) => label.name === "submission")) return true;
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls/${pull.number}/files?per_page=100`, {
    headers: headers(),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`GitHub pull request file query failed with ${response.status}`);
  const files = (await response.json()) as GitHubPullRequestFile[];
  return files.some((file) => file.filename.startsWith("platform/submissions/"));
}

async function verificationStatus(repository: string, sha: string): Promise<PendingSubmission["status"]> {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/status`, {
    headers: headers(),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`GitHub commit status query failed with ${response.status}`);
  const body = (await response.json()) as { statuses?: GitHubCommitStatus[] };
  const status = body.statuses?.find((candidate) => candidate.context === "parano1d/verify-submission");
  if (!status) return "queued";
  if (status.state === "pending") return "checking";
  if (status.state === "success") return "ready";
  return "rejected";
}

export async function fetchPendingSubmissions(): Promise<PendingSubmission[]> {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) return [];
  const now = Date.now();
  if (cache?.repository === repository && cache.expiresAt > now) return cache.value;
  const response = await fetch(`https://api.github.com/repos/${repository}/pulls?state=open&per_page=30`, {
    headers: headers(),
    cache: "no-store"
  });
  if (!response.ok) {
    if (cache?.repository === repository) return cache.value;
    throw new Error(`GitHub pull request query failed with ${response.status}`);
  }
  const pulls = (await response.json()) as GitHubPullRequest[];
  const classified = await Promise.all(
    pulls.map(async (pull) => ({ pull, submission: await isSubmissionPullRequest(repository, pull) }))
  );
  const submissions = classified.filter((item) => item.submission).map((item) => item.pull);
  const value = await Promise.all(
    submissions.map(async (pull): Promise<PendingSubmission | null> => {
      if (!pull.user) return null;
      return {
        id: `pr-${pull.number}`,
        number: pull.number,
        title: pull.title,
        url: pull.html_url,
        authorLogin: pull.user.login,
        authorUrl: pull.user.html_url,
        avatarUrl: pull.user.avatar_url,
        updatedAt: pull.updated_at,
        status: pull.draft ? "queued" : await verificationStatus(repository, pull.head.sha)
      };
    })
  );
  const filtered = value.filter((item): item is PendingSubmission => item !== null);
  cache = { repository, expiresAt: now + 60_000, value: filtered };
  return filtered;
}
