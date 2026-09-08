import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { canonicalJson } from "@/lib/canonical-json";
import { delegatedContentDigest, serviceDelegationActor } from "@/lib/delegation";
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import { verifySubmission } from "@/lib/verifier";

const checkedAt = "2026-08-29T12:01:00.000Z";
const botActor = "test-autoresearch[bot]";

function hostedSubmission(schemaVersion: 1 | 2 = 1): { root: string; directory: string; keyDirectory: string } {
  const root = mkdtempSync(path.join(tmpdir(), "parano1d-delegation-test-"));
  const directory = path.join(root, "hosted-all-root-review");
  const keyDirectory = path.join(root, "keys");
  mkdirSync(directory);
  mkdirSync(keyDirectory);
  const report = "Independent review of the frozen adaptive all-root QROM theorem. This passive report checks statement namespaces, recursive parent selection, deterministic traversal, bad-event accounting, and the terminal invalid-State game against the pinned production and certificate revisions.\n";
  const reportSha256 = createHash("sha256").update(report).digest("hex");
  writeFileSync(path.join(directory, "report.md"), report);
  writeFileSync(path.join(directory, "submission.json"), JSON.stringify({
    schemaVersion: 1,
    id: "hosted-all-root-review",
    track: "recursive-all-root-proof",
    contractVersion: "1.1.0",
    title: "Hosted independent all-root theorem review",
    note: "This report checks the exact statement-keyed theorem against the pinned from-genesis invalid-State game.",
    attribution: { mode: "ai-assisted", model: { provider: "openai", model: "gpt-5", displayName: "GPT-5", agent: "Codex" } },
    payload: {
      productionCommit: PRODUCTION_REVISION,
      certificateCommit: CERTIFICATE_REVISION,
      reportPath: "report.md",
      reportSha256,
      affectedClaimId: "adaptive-all-root-qrom",
      finding: "supports"
    }
  }));

  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const keyId = schemaVersion === 1 ? "test-hosted-key" : "test-portal-key";
  const publicKeySpki = publicKey.export({ format: "der", type: "spki" }).toString("base64");
  writeFileSync(path.join(keyDirectory, `${keyId}.json`), JSON.stringify(schemaVersion === 1 ? {
    schemaVersion: 1, keyId, algorithm: "Ed25519", issuer: "noid.network", botLogin: botActor,
    publicKeySpki, validFrom: "2026-08-29T00:00:00.000Z"
  } : {
    schemaVersion: 2, keyId, algorithm: "Ed25519", issuer: "noid.network", purpose: "hosted-research-delegation",
    forge: { provider: "forgejo", origin: "https://git.parano1d.org", repository: "ignotusnemo/parano1d-soundness", botLogin: "noid-network" },
    publicKeySpki, validFrom: "2026-08-29T00:00:00.000Z"
  }));
  const common = {
    issuer: "noid.network" as const,
    keyId,
    repository: "ignotusnemo/parano1d-soundness" as const,
    runId: "d98b8ce8-f013-4b9a-95ea-b85cf876e64a",
    submissionId: "hosted-all-root-review",
    issuedAt: "2026-08-29T12:00:00.000Z",
    contentDigest: delegatedContentDigest(directory)
  };
  const signed = schemaVersion === 1 ? {
    schemaVersion: 1 as const, ...common, researcher: { githubId: "12345678", login: "alice-researcher" }
  } : {
    schemaVersion: 2 as const, ...common,
    researcher: { id: "1000000000000000001", login: "alice_researcher", profileUrl: "https://noid.network/members/alice_researcher" },
    forge: { provider: "forgejo" as const, origin: "https://git.parano1d.org", botLogin: "noid-network" }
  };
  const signature = sign(null, Buffer.from(canonicalJson(signed)), privateKey).toString("base64url");
  writeFileSync(path.join(directory, "delegation.json"), JSON.stringify({ ...signed, signature }));
  return { root, directory, keyDirectory };
}

function verifyHosted(submission: ReturnType<typeof hostedSubmission>, actor = botActor) {
  return verifySubmission({
    root: path.resolve("."),
    submissionDirectory: submission.directory,
    delegationKeyDirectory: submission.keyDirectory,
    context: {
      repository: "ignotusnemo/parano1d-soundness",
      commit: "0123456789abcdef0123456789abcdef01234567",
      actor,
      pullRequest: 42
    },
    checkedAt
  });
}

test("a signed hosted delegation binds the GitHub researcher to exact passive bytes", () => {
  const submission = hostedSubmission();
  try {
    const result = verifyHosted(submission);
    assert.equal(result.status, "pending-review");
    assert.deepEqual(result.context.researcher, {
      githubId: "12345678",
      login: "alice-researcher",
      profileUrl: "https://github.com/alice-researcher",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
      delegation: {
        issuer: "noid.network",
        keyId: "test-hosted-key",
        runId: "d98b8ce8-f013-4b9a-95ea-b85cf876e64a"
      }
    });
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("the accepted ledger reconstructs the bot actor from the pinned delegation key", () => {
  const submission = hostedSubmission();
  try {
    assert.equal(serviceDelegationActor(submission.directory, submission.keyDirectory), botActor);
    const result = verifyHosted(submission, serviceDelegationActor(submission.directory, submission.keyDirectory));
    assert.equal(result.status, "pending-review");
    assert.equal(result.context.researcher?.login, "alice-researcher");
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a portal delegation binds a local researcher identity to the pinned Forgejo service", () => {
  const submission = hostedSubmission(2);
  try {
    assert.equal(serviceDelegationActor(submission.directory, submission.keyDirectory), "noid-network");
    const result = verifyHosted(submission, "noid-network");
    assert.equal(result.status, "pending-review");
    assert.deepEqual(result.context.researcher, {
      identityProvider: "noid.network",
      id: "1000000000000000001",
      login: "alice_researcher",
      profileUrl: "https://noid.network/members/alice_researcher",
      avatarUrl: "https://noid.network/api/avatars/1000000000000000001",
      delegation: {
        issuer: "noid.network",
        keyId: "test-portal-key",
        runId: "d98b8ce8-f013-4b9a-95ea-b85cf876e64a"
      }
    });
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a hosted delegation fails after any signed report byte changes", () => {
  const submission = hostedSubmission();
  try {
    writeFileSync(path.join(submission.directory, "report.md"), `${readFileSync(path.join(submission.directory, "report.md"), "utf8")}changed\n`);
    const result = verifyHosted(submission);
    assert.equal(result.status, "rejected");
    assert.match(result.reasons[0] ?? "", /delegation does not match the passive submission bytes/u);
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a valid delegation is rejected when another GitHub actor opens the pull request", () => {
  const submission = hostedSubmission();
  try {
    const result = verifyHosted(submission, "another-bot[bot]");
    assert.equal(result.status, "rejected");
    assert.match(result.reasons[0] ?? "", /pinned service account/u);
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a bot-authored pull request without a delegation cannot enter verification", () => {
  const submission = hostedSubmission();
  try {
    rmSync(path.join(submission.directory, "delegation.json"));
    const result = verifyHosted(submission);
    assert.equal(result.status, "rejected");
    assert.match(result.reasons[0] ?? "", /requires a valid hosted researcher delegation/u);
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a caller cannot inject researcher identity without signed delegation", () => {
  const submission = hostedSubmission();
  try {
    rmSync(path.join(submission.directory, "delegation.json"));
    assert.throws(() => verifySubmission({
      root: path.resolve("."),
      submissionDirectory: submission.directory,
      context: {
        repository: "ignotusnemo/parano1d-soundness",
        commit: "0123456789abcdef0123456789abcdef01234567",
        actor: "direct-researcher",
        pullRequest: 43,
        researcher: {
          githubId: "87654321",
          login: "forged-researcher",
          profileUrl: "https://github.com/forged-researcher",
          avatarUrl: "https://avatars.githubusercontent.com/u/87654321?v=4",
          delegation: { issuer: "noid.network", keyId: "test-hosted-key", runId: "d98b8ce8-f013-4b9a-95ea-b85cf876e64a" }
        }
      }
    }), /must be derived from a signed delegation/u);
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});
