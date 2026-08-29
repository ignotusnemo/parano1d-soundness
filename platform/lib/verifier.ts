import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadTrack } from "@/lib/catalog";
import { digestCanonicalJson } from "@/lib/canonical-json";
import { parseStrictJson } from "@/lib/strict-json";
import {
  manualAuditPayloadSchema,
  reproductionPayloadSchema,
  submissionManifestSchema,
  verificationContextSchema
} from "@/lib/schemas";
import { runCertificate } from "@/lib/certificate-runner";
import type { SubmissionManifest, VerificationContext, VerificationResult } from "@/lib/types";

export const VERIFIER_NAME = "parano1d-soundness-platform";
export const VERIFIER_VERSION = "0.1.0";

export interface VerificationOptions {
  root: string;
  submissionDirectory: string;
  context: VerificationContext;
  checkedAt?: string;
}

export function loadSubmission(directory: string): SubmissionManifest {
  const filePath = path.join(directory, "submission.json");
  return submissionManifestSchema.parse(parseStrictJson(readFileSync(filePath, "utf8")));
}

function rejected(
  manifest: SubmissionManifest,
  context: VerificationContext,
  reasons: string[],
  observed: Record<string, string>,
  checkedAt: string
): VerificationResult {
  return finalizeResult({
    schemaVersion: 1,
    submissionId: manifest.id,
    trackId: manifest.track,
    status: "rejected",
    checkedAt,
    verifier: VERIFIER_NAME,
    verifierVersion: VERIFIER_VERSION,
    reasons,
    observed,
    resultDigest: "",
    context
  });
}

function finalizeResult(result: VerificationResult): VerificationResult {
  const { resultDigest: _discardedDigest, ...digestInput } = result;
  return { ...result, resultDigest: digestCanonicalJson(digestInput) };
}

export function verifySubmission(options: VerificationOptions): VerificationResult {
  const context = verificationContextSchema.parse(options.context);
  const manifest = loadSubmission(options.submissionDirectory);
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const track = loadTrack(options.root, manifest.track);
  if (track.contractVersion !== manifest.contractVersion) {
    return rejected(manifest, context, ["submission contract version does not match the active track"], {}, checkedAt);
  }
  if (track.state !== "active") {
    return rejected(manifest, context, ["track contract is not active"], {}, checkedAt);
  }

  if (track.validator === "certificate-reproduction") {
    const payload = reproductionPayloadSchema.parse(manifest.payload);
    const certificateDirectory = process.env.PARANO1D_SOUNDNESS_DIR ?? path.resolve(options.root, "..");
    const certificateCommit = track.expected?.certificateCommit;
    if (!certificateCommit) return rejected(manifest, context, ["track has no frozen certificate revision"], {}, checkedAt);
    let observed: Record<string, string>;
    try {
      observed = { ...runCertificate(certificateDirectory, certificateCommit) };
    } catch (error) {
      return rejected(
        manifest,
        context,
        [`protected certificate execution failed: ${error instanceof Error ? error.message : String(error)}`],
        {},
        checkedAt
      );
    }
    const expected = track.expected ?? {};
    const submitted = payload as unknown as Record<string, string>;
    const reasons: string[] = [];
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (observed[key] !== expectedValue) reasons.push(`protected observation ${key} differs from the frozen contract`);
      if (submitted[key] !== expectedValue) reasons.push(`submitted value ${key} differs from the frozen contract`);
    }
    if (reasons.length > 0) return rejected(manifest, context, reasons, observed, checkedAt);
    return finalizeResult({
      schemaVersion: 1,
      submissionId: manifest.id,
      trackId: manifest.track,
      status: "accepted",
      checkedAt,
      verifier: VERIFIER_NAME,
      verifierVersion: VERIFIER_VERSION,
      reasons: [],
      observed,
      resultDigest: "",
      context
    });
  }

  if (track.validator === "manual-audit") {
    const payload = manualAuditPayloadSchema.parse(manifest.payload);
    const reportPath = path.join(options.submissionDirectory, payload.reportPath);
    const report = readFileSync(reportPath);
    const digest = createHash("sha256").update(report).digest("hex");
    const reasons = digest === payload.reportSha256 ? [] : ["audit report digest does not match report.md"];
    if (reasons.length > 0) return rejected(manifest, context, reasons, { reportSha256: digest }, checkedAt);
    return finalizeResult({
      schemaVersion: 1,
      submissionId: manifest.id,
      trackId: manifest.track,
      status: "pending-review",
      checkedAt,
      verifier: VERIFIER_NAME,
      verifierVersion: VERIFIER_VERSION,
      reasons: ["semantic audit confirmation requires two trusted reviewers"],
      observed: { reportSha256: digest },
      resultDigest: "",
      context
    });
  }

  return rejected(manifest, context, ["track validator is reserved but not implemented"], {}, checkedAt);
}
