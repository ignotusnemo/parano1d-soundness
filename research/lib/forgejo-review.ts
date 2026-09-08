import type { ReviewDecision, VerificationContext } from "@/lib/types";

interface ForgejoPullRequest {
  head: { sha: string };
  user: { login: string } | null;
}

interface ForgejoPullCommit { sha: string; }

interface ForgejoReview {
  id: number;
  state: string;
  commit_id: string;
  submitted_at: string | null;
  user: { login: string } | null;
}

type FetchRequest = (input: string, init?: RequestInit) => Promise<Response>;
const origin = "https://git.parano1d.org";

async function forgejoJson<T>(url: string, request: FetchRequest): Promise<T> {
  const response = await request(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Forgejo review verification failed with ${response.status}`);
  return await response.json() as T;
}

function apiRoot(repository: string): string {
  return `${origin}/api/v1/repos/${repository}`;
}

function reviewId(url: string, repository: string, pullRequest: number): number {
  const escapedRepository = repository.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = new RegExp(`^${origin.replaceAll(".", "\\.")}\/api\/v1\/repos\/${escapedRepository}\/pulls\/${pullRequest}\/reviews\/([1-9][0-9]*)$`, "u").exec(url);
  if (!match?.[1]) throw new Error(`review URL is outside Forgejo pull request ${repository}#${pullRequest}`);
  return Number(match[1]);
}

function assertPullActor(pull: ForgejoPullRequest, context: VerificationContext): void {
  if (!pull.user || pull.user.login !== context.actor) throw new Error("pull request author differs from the frozen submission actor");
}

export async function verifyForgejoPullRequestContext(context: VerificationContext, request: FetchRequest = fetch): Promise<void> {
  const pullRequest = context.pullRequest;
  if (!pullRequest) throw new Error("accepted submission context has no pull request");
  if (context.researcher?.identityProvider !== "noid.network") throw new Error("Forgejo pull request verification requires a noid.network researcher delegation");
  const pull = await forgejoJson<ForgejoPullRequest>(`${apiRoot(context.repository)}/pulls/${pullRequest}`, request);
  assertPullActor(pull, context);
  if (pull.head.sha !== context.commit) throw new Error("pull request head differs from the frozen submission commit");
}

export async function verifyForgejoReviewApprovals(decision: ReviewDecision, request: FetchRequest = fetch): Promise<void> {
  const pullRequest = decision.context.pullRequest;
  if (!pullRequest) throw new Error("reviewed decision has no pull request");
  if (decision.context.researcher?.identityProvider !== "noid.network") throw new Error("Forgejo review verification requires a noid.network researcher delegation");
  const root = apiRoot(decision.context.repository);
  const pull = await forgejoJson<ForgejoPullRequest>(`${root}/pulls/${pullRequest}`, request);
  assertPullActor(pull, decision.context);
  const commits = await forgejoJson<ForgejoPullCommit[]>(`${root}/pulls/${pullRequest}/commits?limit=100`, request);
  if (!commits.some((commit) => commit.sha === decision.context.commit)) throw new Error("attested source commit is not part of the Forgejo pull request");
  for (const reviewer of decision.reviewers) {
    const id = reviewId(reviewer.reviewUrl, decision.context.repository, pullRequest);
    const review = await forgejoJson<ForgejoReview>(`${root}/pulls/${pullRequest}/reviews/${id}`, request);
    if (review.id !== id) throw new Error(`Forgejo review ${id} has inconsistent identity`);
    if (!review.user || review.user.login !== reviewer.login) throw new Error(`Forgejo review ${id} belongs to another reviewer`);
    if (review.state.toUpperCase() !== "APPROVED") throw new Error(`Forgejo review ${id} is not currently approved`);
    if (review.commit_id !== decision.context.commit) throw new Error(`Forgejo review ${id} approved another commit`);
    if (!review.submitted_at || Date.parse(review.submitted_at) > Date.parse(decision.acceptedAt)) throw new Error(`Forgejo review ${id} was not present at the recorded acceptance time`);
  }
  const stablePull = await forgejoJson<ForgejoPullRequest>(`${root}/pulls/${pullRequest}`, request);
  assertPullActor(stablePull, decision.context);
  if (stablePull.head.sha !== pull.head.sha) throw new Error("Forgejo pull request head changed during review verification");
}
