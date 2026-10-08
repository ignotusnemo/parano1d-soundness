import assert from "node:assert/strict";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deriveResearchState } from "@/lib/derive";
import { evidenceFromAcceptedResult } from "@/lib/promotion";
import { loadSubmission, verifySubmission } from "@/lib/verifier";

const sourceRoot = process.cwd();
const temporaryRoot = path.join(sourceRoot, ".local-flow");
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(path.join(temporaryRoot, "ledger/accepted"), { recursive: true });
cpSync(path.join(sourceRoot, "catalog"), path.join(temporaryRoot, "catalog"), { recursive: true });
cpSync(path.join(sourceRoot, "evidence"), path.join(temporaryRoot, "evidence"), { recursive: true });
cpSync(path.join(sourceRoot, "certificates"), path.join(temporaryRoot, "certificates"), { recursive: true });
const context = {
  repository: "ignotusnemo/parano1d-soundness",
  commit: "0123456789abcdef0123456789abcdef01234567",
  actor: "local-verifier",
  pullRequest: 1
};
const checkedAt = "2026-08-29T10:00:00.000Z";
const validDirectory = path.join(sourceRoot, "submissions/examples/reproduction-valid");
const valid = verifySubmission({ root: temporaryRoot, submissionDirectory: validDirectory, context, checkedAt });
assert.equal(valid.status, "accepted");
const record = evidenceFromAcceptedResult(loadSubmission(validDirectory), valid);
writeFileSync(
  path.join(temporaryRoot, "ledger/accepted", `${record.id}.json`),
  `${JSON.stringify(record, null, 2)}\n`
);
const state = deriveResearchState(temporaryRoot);
assert.equal(state.leaderboard.find((entry) => entry.login === "local-verifier")?.accepted, 1);
assert.equal(state.modelLeaderboard.find((entry) => entry.displayName === "GPT-5")?.accepted, 1);
assert.deepEqual(record.effects, [{ claimId: "v2-joint-bank-accounting", status: "verified", metrics: [] }]);
assert.equal(state.conclusion.status, "verified");
const invalid = verifySubmission({
  root: temporaryRoot,
  submissionDirectory: path.join(sourceRoot, "submissions/examples/reproduction-invalid"),
  context,
  checkedAt
});
assert.equal(invalid.status, "rejected");
assert.ok(invalid.reasons.some((reason) => reason.includes("categoryOneGateDepthBits")));
process.stdout.write("local flow: accepted valid reproduction, promoted immutable record, rejected altered bound\n");
