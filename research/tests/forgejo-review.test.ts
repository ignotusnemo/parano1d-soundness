import assert from "node:assert/strict";
import test from "node:test";
import { verifyForgejoPullRequestContext } from "@/lib/forgejo-review";
import type { VerificationContext } from "@/lib/types";

const context: VerificationContext = {
  repository: "ignotusnemo/parano1d-soundness",
  commit: "0123456789abcdef0123456789abcdef01234567",
  actor: "noid-network",
  pullRequest: 17,
  researcher: {
    identityProvider: "noid.network",
    id: "1000000000000000001",
    login: "alice_researcher",
    profileUrl: "https://noid.network/members/alice_researcher",
    avatarUrl: "https://noid.network/api/avatars/1000000000000000001",
    delegation: { issuer: "noid.network", keyId: "test-portal-key", runId: "d98b8ce8-f013-4b9a-95ea-b85cf876e64a" }
  }
};

test("Forgejo pull request verification binds the service actor and exact commit", async () => {
  const requested: string[] = [];
  await verifyForgejoPullRequestContext(context, async (url) => {
    requested.push(url);
    return Response.json({ head: { sha: context.commit }, user: { login: context.actor } });
  });
  assert.deepEqual(requested, ["https://git.parano1d.org/api/v1/repos/ignotusnemo/parano1d-soundness/pulls/17"]);
});

test("Forgejo pull request verification rejects another head", async () => {
  await assert.rejects(
    verifyForgejoPullRequestContext(context, async () => Response.json({ head: { sha: "f".repeat(40) }, user: { login: context.actor } })),
    /head differs from the frozen submission commit/u
  );
});
