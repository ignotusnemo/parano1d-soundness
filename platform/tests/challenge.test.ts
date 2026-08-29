import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createChallengeSubmission, sealChallengeSubmission } from "@/lib/challenge";
import { parseStrictJson } from "@/lib/strict-json";
import { verifySubmission } from "@/lib/verifier";

test("an agent-ready workspace seals passive evidence and reaches contract review", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "parano1d-challenge-test-"));
  const destination = path.join(temporary, "production-audit-result");
  try {
    mkdirSync(temporary, { recursive: true });
    const files = createChallengeSubmission({
      root: path.resolve("."),
      destination,
      id: "production-audit-result",
      trackId: "production-correspondence-audit",
      attribution: {
        mode: "ai-assisted",
        model: { provider: "openai", model: "gpt-5", displayName: "GPT-5", agent: "Codex" }
      }
    });
    assert.deepEqual(files.map((file) => path.basename(file)), ["submission.json", "report.md"]);
    writeFileSync(path.join(destination, "artifact.json"), "{\"schemaVersion\":1,\"kind\":\"source-map\",\"entries\":[]}\n");
    const sealed = sealChallengeSubmission(destination);
    assert.equal(sealed.payload.artifactPath, "artifact.json");
    assert.match(String(sealed.payload.artifactSha256), /^[0-9a-f]{64}$/u);
    const result = verifySubmission({
      root: path.resolve("."),
      submissionDirectory: destination,
      context: {
        repository: "local/autoresearch",
        commit: "0000000000000000000000000000000000000000",
        actor: "local-researcher"
      },
      checkedAt: "2026-08-29T12:00:00.000Z"
    });
    assert.equal(result.status, "pending-review");
    assert.equal(parseStrictJson(readFileSync(path.join(destination, "artifact.json"), "utf8")) !== null, true);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
