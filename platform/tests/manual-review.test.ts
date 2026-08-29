import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import { verifySubmission } from "@/lib/verifier";

const context = {
  repository: "ignotusnemo/parano1d-soundness",
  commit: "0123456789abcdef0123456789abcdef01234567",
  actor: "reviewer",
  pullRequest: 7
};

function reviewSubmission(affectedClaimId: string): { root: string; directory: string } {
  const root = mkdtempSync(path.join(tmpdir(), "parano1d-review-test-"));
  const directory = path.join(root, "all-root-independent-review");
  mkdirSync(directory);
  const report = "Independent review of the exact all-root theorem and its pinned from-genesis game. The report checks typed statement namespaces, adaptive recursive parents, deterministic post-measurement traversal, all declared bad events and the terminal invalid-State condition against the frozen theorem.\n";
  const reportSha256 = createHash("sha256").update(report).digest("hex");
  writeFileSync(path.join(directory, "report.md"), report);
  writeFileSync(path.join(directory, "submission.json"), JSON.stringify({
    schemaVersion: 1,
    id: "all-root-independent-review",
    track: "recursive-all-root-proof",
    contractVersion: "1.0.0",
    title: "Independent all-root theorem review",
    note: "This report checks the exact statement-keyed all-root theorem against the pinned from-genesis invalid-State game.",
    attribution: { mode: "ai-assisted", model: { provider: "openai", model: "gpt-5", displayName: "GPT-5", agent: "Codex" } },
    payload: {
      productionCommit: PRODUCTION_REVISION,
      certificateCommit: CERTIFICATE_REVISION,
      reportPath: "report.md",
      reportSha256,
      affectedClaimId,
      finding: "supports"
    }
  }));
  return { root, directory };
}

test("an active cryptographic track passes passive checks and enters expert review", () => {
  const submission = reviewSubmission("adaptive-all-root-qrom");
  try {
    const result = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(result.status, "pending-review");
    assert.match(result.reasons[0] ?? "", /expert review is required/u);
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a review track cannot target another claim", () => {
  const submission = reviewSubmission("fixed-poseidon2b-delta");
  try {
    const result = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(result.status, "rejected");
    assert.ok(result.reasons.includes("affected claim does not match the selected track"));
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a manifest identifier must equal its submission directory", () => {
  const submission = reviewSubmission("adaptive-all-root-qrom");
  try {
    const manifestPath = path.join(submission.directory, "submission.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.id = "different-review-id";
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(result.status, "rejected");
    assert.ok(result.reasons.includes("submission identifier does not match its directory"));
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("a declared artifact must exist and use strict passive JSON", () => {
  const submission = reviewSubmission("adaptive-all-root-qrom");
  try {
    const manifestPath = path.join(submission.directory, "submission.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { payload: Record<string, unknown> };
    manifest.payload.artifactPath = "artifact.json";
    manifest.payload.artifactSha256 = "0".repeat(64);
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const missing = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(missing.status, "rejected");
    assert.ok(missing.reasons.includes("artifact.json is declared but missing"));

    const artifact = "{\"schemaVersion\":1,\"schemaVersion\":1}\n";
    writeFileSync(path.join(submission.directory, "artifact.json"), artifact);
    manifest.payload.artifactSha256 = createHash("sha256").update(artifact).digest("hex");
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const duplicate = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(duplicate.status, "rejected");
    assert.ok(duplicate.reasons.some((reason) => reason.includes("duplicate object key")));
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("review submissions reject undeclared files outside the passive envelope", () => {
  const submission = reviewSubmission("adaptive-all-root-qrom");
  try {
    writeFileSync(path.join(submission.directory, "artifact.json"), "{}\n");
    const result = verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context });
    assert.equal(result.status, "rejected");
    assert.ok(result.reasons.includes("review submission files do not exactly match the declared passive envelope"));
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});

test("submission files cannot be symbolic links", () => {
  const submission = reviewSubmission("adaptive-all-root-qrom");
  try {
    symlinkSync("report.md", path.join(submission.directory, "artifact.json"));
    assert.throws(
      () => verifySubmission({ root: path.resolve("."), submissionDirectory: submission.directory, context }),
      /not a regular passive file/u
    );
  } finally {
    rmSync(submission.root, { recursive: true, force: true });
  }
});
