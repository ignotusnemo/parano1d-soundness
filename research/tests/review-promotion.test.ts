import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadTrack } from "@/lib/catalog";
import { verifyGitHubPullRequestContext, verifyGitHubReviewApprovals } from "@/lib/github-review";
import { createServiceReviewAttestation } from "@/lib/review-attestation";
import { evidenceFromReviewedDecision } from "@/lib/review";
import { reviewDecisionSchema } from "@/lib/schemas";
import { loadSubmission, verifySubmission } from "@/lib/verifier";

const root = path.resolve(".");
const submissionDirectory = path.join(root, "submissions/examples/all-root-review-example");
const context = {
  repository: "ignotusnemo/parano1d-soundness",
  commit: "0123456789abcdef0123456789abcdef01234567",
  actor: "outside-researcher",
  pullRequest: 7
};
const verificationCheckedAt = "2026-08-29T12:00:00.000Z";

function reviewedFixture() {
  const manifest = loadSubmission(submissionDirectory);
  const track = loadTrack(root, manifest.track);
  const result = verifySubmission({ root, submissionDirectory, context, checkedAt: verificationCheckedAt });
  assert.equal(result.status, "pending-review");
  const decision = reviewDecisionSchema.parse({
    schemaVersion: 1,
    id: `${manifest.id}-${context.commit.slice(0, 12)}`,
    submissionId: manifest.id,
    trackId: manifest.track,
    acceptedAt: "2026-08-29T13:00:00.000Z",
    verificationCheckedAt,
    verificationResultDigest: result.resultDigest,
    note: "The frozen all-root theorem was independently checked against the submitted argument and accepted within the exact published scope.",
    context,
    reviewers: [
      { login: "ignotusnemo", role: "maintainer", reviewUrl: "https://github.com/ignotusnemo/parano1d-soundness/pull/7#pullrequestreview-101" },
      { login: "cryptographer", role: "independent", reviewUrl: "https://github.com/ignotusnemo/parano1d-soundness/pull/7#pullrequestreview-102" }
    ],
    effects: [{ claimId: track.targetClaimId, status: "proved", metrics: [] }]
  });
  return { manifest, track, result, decision };
}

test("an authenticated service attestation replaces only the maintainer GitHub approval", async () => {
  const keyDirectory = mkdtempSync(path.join(tmpdir(), "review-key-"));
  try {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const keyId = "test-review-key";
    writeFileSync(path.join(keyDirectory, `${keyId}.json`), JSON.stringify({
      schemaVersion: 1,
      keyId,
      algorithm: "Ed25519",
      issuer: "noid.network",
      purpose: "maintainer-review",
      publicKeySpki: publicKey.export({ format: "der", type: "spki" }).toString("base64"),
      validFrom: "2026-08-29T00:00:00.000Z"
    }));
    const hostedSubmissionDirectory = path.join(root, "submissions/run-16ecaf1ad871460f992045a32a2007a7");
    const manifest = loadSubmission(hostedSubmissionDirectory);
    const track = loadTrack(root, manifest.track);
    const hostedContext = {
      repository: "ignotusnemo/parano1d-soundness",
      commit: "8f3f7168772427899bcc27eed149490ae2848f75",
      actor: "parano1d-autoresearch[bot]",
      pullRequest: 3
    };
    const checkedAt = "2026-08-29T22:12:32.167Z";
    const result = verifySubmission({ root, submissionDirectory: hostedSubmissionDirectory, context: hostedContext, checkedAt, allowLegacyContractVersion: true });
    assert.ok(result.context.researcher);
    const unsigned = reviewDecisionSchema.parse({
      schemaVersion: 1,
      id: `${manifest.id}-${hostedContext.commit.slice(0, 12)}`,
      submissionId: manifest.id,
      trackId: manifest.track,
      reviewedFinding: "inconclusive",
      acceptedAt: "2026-08-29T22:13:08.749Z",
      verificationCheckedAt: checkedAt,
      verificationResultDigest: result.resultDigest,
      note: "The authenticated maintainer reviewed the exact passive report and accepted it as inconclusive with no frontier effect.",
      context: result.context,
      reviewers: [],
      effects: []
    });
    const decision = reviewDecisionSchema.parse({
      ...unsigned,
      attestation: createServiceReviewAttestation(unsigned, {
        keyId,
        privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
        runId: result.context.researcher!.delegation.runId,
        reviewer: { githubId: "98765", login: "ignotusnemo" },
        issuedAt: unsigned.acceptedAt
      })
    });
    const evidence = evidenceFromReviewedDecision(manifest, result, track, decision, keyDirectory);
    assert.deepEqual(evidence.effects, []);
    const request = async (url: string): Promise<Response> => {
      if (url.includes("/pulls/3/commits")) return Response.json([{ sha: hostedContext.commit }, { sha: "f".repeat(40) }]);
      if (url.endsWith("/pulls/3")) return Response.json({ head: { sha: "f".repeat(40) }, user: { login: hostedContext.actor } });
      throw new Error(`unexpected GitHub request: ${url}`);
    };
    await verifyGitHubReviewApprovals(decision, "test-token", request);
    await assert.rejects(
      () => verifyGitHubReviewApprovals(decision, "test-token", async (url) => url.includes("/commits")
        ? Response.json([{ sha: "f".repeat(40) }])
        : Response.json({ head: { sha: "f".repeat(40) }, user: { login: hostedContext.actor } })),
      /source commit is not part/u
    );
    decision.note = `${decision.note} tampered`;
    assert.throws(() => evidenceFromReviewedDecision(manifest, result, track, decision, keyDirectory), /does not match the decision/u);
  } finally {
    rmSync(keyDirectory, { recursive: true, force: true });
  }
});

test("a bound GitHub review decision promotes a pending report into immutable evidence", () => {
  const fixture = reviewedFixture();
  const evidence = evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision);
  assert.equal(evidence.id, "all-root-review-example-0123456789ab");
  assert.equal(evidence.source.authorLogin, "outside-researcher");
  assert.equal(evidence.verification.verifier, "parano1d-soundness-research+github-review");
  assert.deepEqual(evidence.effects, fixture.decision.effects);
});

test("a reviewed inconclusive result is accepted without changing claims or frontiers", () => {
  const fixture = reviewedFixture();
  fixture.manifest.payload = { ...fixture.manifest.payload, finding: "inconclusive" };
  fixture.decision.effects = [];
  const evidence = evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision);
  assert.deepEqual(evidence.effects, []);
  assert.equal(evidence.source.authorLogin, "outside-researcher");
});

test("a maintainer alone may accept a rigorous inconclusive result with no effects", () => {
  const fixture = reviewedFixture();
  fixture.manifest.payload = { ...fixture.manifest.payload, finding: "inconclusive" };
  fixture.decision.effects = [];
  fixture.decision.reviewers = [fixture.decision.reviewers[0]!];
  const evidence = evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision);
  assert.deepEqual(evidence.effects, []);
});

test("reviewers may downgrade a submitted conclusion without changing the signed submission", () => {
  const fixture = reviewedFixture();
  assert.equal((fixture.manifest.payload as { finding: string }).finding, "supports");
  fixture.decision.reviewedFinding = "inconclusive";
  fixture.decision.effects = [];
  fixture.decision.reviewers = [fixture.decision.reviewers[0]!];
  const evidence = evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision);
  assert.deepEqual(evidence.effects, []);
  assert.equal((fixture.manifest.payload as { finding: string }).finding, "supports");
});

test("reviewers cannot upgrade or reverse the submitted finding", () => {
  const fixture = reviewedFixture();
  fixture.manifest.payload = { ...fixture.manifest.payload, finding: "inconclusive" };
  fixture.decision.reviewedFinding = "supports";
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /preserve the submitted finding or downgrade it/u
  );
  fixture.manifest.payload = { ...fixture.manifest.payload, finding: "challenges" };
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /preserve the submitted finding or downgrade it/u
  );
});

test("a claim-changing result still requires the frozen independent review policy", () => {
  const fixture = reviewedFixture();
  fixture.decision.reviewers = [fixture.decision.reviewers[0]!];
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /requires 2 approvals/u
  );
});

test("an inconclusive result cannot smuggle a claim effect into the ledger", () => {
  const fixture = reviewedFixture();
  fixture.manifest.payload = { ...fixture.manifest.payload, finding: "inconclusive" };
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /cannot change a claim or frontier/u
  );
});

test("a conclusive result cannot enter the ledger without a reviewed effect", () => {
  const fixture = reviewedFixture();
  fixture.decision.effects = [];
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /requires at least one reviewed effect/u
  );
});

test("review promotion rejects self-review and duplicated reviewers", () => {
  const fixture = reviewedFixture();
  fixture.decision.reviewers[1] = {
    login: context.actor,
    role: "independent",
    reviewUrl: "https://github.com/ignotusnemo/parano1d-soundness/pull/7#pullrequestreview-102"
  };
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /submission author cannot approve/u
  );
});

test("review promotion rejects a claim status outside the frozen track policy", () => {
  const fixture = reviewedFixture();
  fixture.decision.effects[0]!.status = "premise";
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /cannot assign status premise/u
  );
});

test("review promotion enforces each metric's frozen unit and exact value format", () => {
  const fixture = reviewedFixture();
  fixture.track.reviewPolicy!.statusRules.supports = ["premise"];
  fixture.track.reviewPolicy!.metricRules = [{
    id: "test.delta-upper",
    kind: "probability-upper-bound",
    direction: "minimize",
    unit: "probability",
    valueFormat: "unit-interval-decimal"
  }];
  fixture.decision.effects = [{
    claimId: fixture.track.targetClaimId,
    status: "premise",
    metrics: [{ id: "test.delta-upper", label: "Test delta upper", value: "0.5", unit: "bits", kind: "probability-upper-bound", scope: "Exact test metric scope" }]
  }];
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /wrong unit/u
  );
  fixture.decision.effects[0]!.metrics[0]!.unit = "probability";
  fixture.decision.effects[0]!.metrics[0]!.value = "1.1";
  assert.throws(
    () => evidenceFromReviewedDecision(fixture.manifest, fixture.result, fixture.track, fixture.decision),
    /unit-interval-decimal/u
  );
});

test("GitHub approval verification binds every approval to the author and exact commit", async () => {
  const fixture = reviewedFixture();
  const request = async (url: string): Promise<Response> => {
    if (url.endsWith("/pulls/7")) {
      return Response.json({ head: { sha: context.commit }, user: { login: context.actor } });
    }
    const id = Number(url.split("/").at(-1));
    const reviewer = fixture.decision.reviewers.find((candidate) => candidate.reviewUrl.endsWith(`-${id}`));
    return Response.json({
      id,
      state: "APPROVED",
      commit_id: context.commit,
      submitted_at: "2026-08-29T12:30:00.000Z",
      user: { login: reviewer?.login },
      html_url: reviewer?.reviewUrl
    });
  };
  await verifyGitHubReviewApprovals(fixture.decision, "test-token", request);
});

test("automatic promotion identity is bound to the exact GitHub pull request", async () => {
  const request = async (): Promise<Response> => Response.json({
    head: { sha: context.commit },
    user: { login: context.actor }
  });
  await verifyGitHubPullRequestContext(context, "test-token", request);
  await assert.rejects(
    () => verifyGitHubPullRequestContext({ ...context, actor: "another-author" }, "test-token", request),
    /author differs/u
  );
});

test("GitHub approval verification rejects approval of a stale commit", async () => {
  const fixture = reviewedFixture();
  const request = async (url: string): Promise<Response> => {
    if (url.endsWith("/pulls/7")) {
      return Response.json({ head: { sha: context.commit }, user: { login: context.actor } });
    }
    const id = Number(url.split("/").at(-1));
    const reviewer = fixture.decision.reviewers.find((candidate) => candidate.reviewUrl.endsWith(`-${id}`));
    return Response.json({
      id,
      state: "APPROVED",
      commit_id: "ffffffffffffffffffffffffffffffffffffffff",
      submitted_at: "2026-08-29T12:30:00.000Z",
      user: { login: reviewer?.login },
      html_url: reviewer?.reviewUrl
    });
  };
  await assert.rejects(() => verifyGitHubReviewApprovals(fixture.decision, "test-token", request), /approved another commit/u);
});

test("GitHub approval verification rejects a pull request changed during review checks", async () => {
  const fixture = reviewedFixture();
  let pullReads = 0;
  const request = async (url: string): Promise<Response> => {
    if (url.endsWith("/pulls/7")) {
      pullReads += 1;
      return Response.json({
        head: { sha: pullReads === 1 ? context.commit : "ffffffffffffffffffffffffffffffffffffffff" },
        user: { login: context.actor }
      });
    }
    const id = Number(url.split("/").at(-1));
    const reviewer = fixture.decision.reviewers.find((candidate) => candidate.reviewUrl.endsWith(`-${id}`));
    return Response.json({
      id,
      state: "APPROVED",
      commit_id: context.commit,
      submitted_at: "2026-08-29T12:30:00.000Z",
      user: { login: reviewer?.login },
      html_url: reviewer?.reviewUrl
    });
  };
  await assert.rejects(
    () => verifyGitHubReviewApprovals(fixture.decision, "test-token", request),
    /head differs from the frozen submission commit/u
  );
});
