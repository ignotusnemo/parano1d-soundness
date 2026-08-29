import type { ReviewDecision, VerificationContext } from "@/lib/types";

interface GitHubPullRequest {
  head: { sha: string };
  user: { login: string } | null;
}

function assertPullMatches(pull: GitHubPullRequest, context: VerificationContext): void {
  if (pull.head.sha !== context.commit) throw new Error("pull request head differs from the frozen submission commit");
  if (!pull.user || pull.user.login !== context.actor) throw new Error("pull request author differs from the frozen submission actor");
}

interface GitHubReview {
  id: number;
  state: string;
  commit_id: string;
  submitted_at: string | null;
  user: { login: string } | null;
  html_url: string;
}

type FetchRequest = (input: string, init?: RequestInit) => Promise<Response>;

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function githubJson<T>(url: string, token: string, request: FetchRequest): Promise<T> {
  const response = await request(url, { headers: headers(token), cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`GitHub review verification failed with ${response.status}`);
  return await response.json() as T;
}

function reviewId(url: string, repository: string, pullRequest: number): number {
  const escapedRepository = repository.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = new RegExp(`^https://github\\.com/${escapedRepository}/pull/${pullRequest}#pullrequestreview-([1-9][0-9]*)$`, "u").exec(url);
  if (!match?.[1]) throw new Error(`review URL is outside pull request ${repository}#${pullRequest}`);
  return Number(match[1]);
}

export async function verifyGitHubPullRequestContext(
  context: VerificationContext,
  token: string,
  request: FetchRequest = fetch
): Promise<void> {
  const pullRequest = context.pullRequest;
  if (!pullRequest) throw new Error("accepted submission context has no pull request");
  const apiRoot = `https://api.github.com/repos/${context.repository}`;
  const pull = await githubJson<GitHubPullRequest>(`${apiRoot}/pulls/${pullRequest}`, token, request);
  assertPullMatches(pull, context);
}

export async function verifyGitHubReviewApprovals(
  decision: ReviewDecision,
  token: string,
  request: FetchRequest = fetch
): Promise<void> {
  const pullRequest = decision.context.pullRequest;
  if (!pullRequest) throw new Error("reviewed decision has no pull request");
  const apiRoot = `https://api.github.com/repos/${decision.context.repository}`;
  const pull = await githubJson<GitHubPullRequest>(`${apiRoot}/pulls/${pullRequest}`, token, request);
  assertPullMatches(pull, decision.context);

  for (const reviewer of decision.reviewers) {
    const id = reviewId(reviewer.reviewUrl, decision.context.repository, pullRequest);
    const review = await githubJson<GitHubReview>(`${apiRoot}/pulls/${pullRequest}/reviews/${id}`, token, request);
    if (review.id !== id || review.html_url !== reviewer.reviewUrl) throw new Error(`GitHub review ${id} has inconsistent identity`);
    if (!review.user || review.user.login !== reviewer.login) throw new Error(`GitHub review ${id} belongs to another reviewer`);
    if (review.state !== "APPROVED") throw new Error(`GitHub review ${id} is not currently approved`);
    if (review.commit_id !== decision.context.commit) throw new Error(`GitHub review ${id} approved another commit`);
    if (!review.submitted_at || Date.parse(review.submitted_at) > Date.parse(decision.acceptedAt)) {
      throw new Error(`GitHub review ${id} was not present at the recorded acceptance time`);
    }
  }
  const stablePull = await githubJson<GitHubPullRequest>(`${apiRoot}/pulls/${pullRequest}`, token, request);
  assertPullMatches(stablePull, decision.context);
}
