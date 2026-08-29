import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
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
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import type { SubmissionManifest, VerificationContext, VerificationResult } from "@/lib/types";

export const VERIFIER_NAME = "parano1d-soundness-platform";
export const VERIFIER_VERSION = "0.1.0";
const MAXIMUM_SUBMISSION_BYTES = 1_048_576;
const PASSIVE_FILE_NAMES = new Set(["submission.json", "report.md", "artifact.json"]);

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

function submissionEnvelope(directory: string): Set<string> {
  const names = readdirSync(directory);
  let totalBytes = 0;
  for (const name of names) {
    if (!PASSIVE_FILE_NAMES.has(name)) throw new Error(`submission contains a file outside the passive envelope: ${name}`);
    const metadata = lstatSync(path.join(directory, name));
    if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`submission entry is not a regular passive file: ${name}`);
    totalBytes += metadata.size;
  }
  if (totalBytes > MAXIMUM_SUBMISSION_BYTES) throw new Error(`submission exceeds ${MAXIMUM_SUBMISSION_BYTES} bytes`);
  return new Set(names);
}

function sameFiles(actual: Set<string>, expected: string[]): boolean {
  return actual.size === expected.length && expected.every((name) => actual.has(name));
}

export function verifySubmission(options: VerificationOptions): VerificationResult {
  const context = verificationContextSchema.parse(options.context);
  const files = submissionEnvelope(options.submissionDirectory);
  const manifest = loadSubmission(options.submissionDirectory);
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  if (path.basename(path.resolve(options.submissionDirectory)) !== manifest.id) {
    return rejected(manifest, context, ["submission identifier does not match its directory"], {}, checkedAt);
  }
  const track = loadTrack(options.root, manifest.track);
  if (track.contractVersion !== manifest.contractVersion) {
    return rejected(manifest, context, ["submission contract version does not match the active track"], {}, checkedAt);
  }
  if (track.state !== "active") {
    return rejected(manifest, context, ["track contract is not active"], {}, checkedAt);
  }

  if (track.validator === "certificate-reproduction") {
    if (!sameFiles(files, ["submission.json"])) {
      return rejected(manifest, context, ["certificate reproduction must contain only submission.json"], {}, checkedAt);
    }
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
    const expectedFiles = ["submission.json", "report.md", ...(payload.artifactPath ? ["artifact.json"] : [])];
    const reportPath = path.join(options.submissionDirectory, payload.reportPath);
    const reasons: string[] = [];
    const observed: Record<string, string> = {};
    if (!sameFiles(files, expectedFiles)) reasons.push("review submission files do not exactly match the declared passive envelope");
    if (!existsSync(reportPath)) {
      reasons.push("report.md is missing");
    } else {
      const report = readFileSync(reportPath);
      const digest = createHash("sha256").update(report).digest("hex");
      observed.reportSha256 = digest;
      if (digest !== payload.reportSha256) reasons.push("audit report digest does not match report.md");
      try {
        const reportText = new TextDecoder("utf-8", { fatal: true }).decode(report);
        if (report.byteLength < 200) reasons.push("report.md is too short for contract review");
        if (reportText.includes("\u0000")) reasons.push("report.md contains a null byte");
      } catch {
        reasons.push("report.md is not valid UTF-8");
      }
    }
    if (payload.artifactPath && payload.artifactSha256) {
      const artifactPath = path.join(options.submissionDirectory, payload.artifactPath);
      if (!existsSync(artifactPath)) {
        reasons.push("artifact.json is declared but missing");
      } else {
        const artifact = readFileSync(artifactPath);
        const artifactDigest = createHash("sha256").update(artifact).digest("hex");
        observed.artifactSha256 = artifactDigest;
        if (artifactDigest !== payload.artifactSha256) reasons.push("research artifact digest does not match artifact.json");
        try {
          parseStrictJson(new TextDecoder("utf-8", { fatal: true }).decode(artifact));
        } catch (error) {
          reasons.push(`artifact.json is not strict passive JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    if (payload.affectedClaimId !== track.targetClaimId) reasons.push("affected claim does not match the selected track");
    if (payload.productionCommit !== PRODUCTION_REVISION) reasons.push("production commit does not match the frozen platform revision");
    if (payload.certificateCommit !== CERTIFICATE_REVISION) reasons.push("certificate commit does not match the frozen platform revision");
    if (reasons.length > 0) return rejected(manifest, context, reasons, observed, checkedAt);
    return finalizeResult({
      schemaVersion: 1,
      submissionId: manifest.id,
      trackId: manifest.track,
      status: "pending-review",
      checkedAt,
      verifier: VERIFIER_NAME,
      verifierVersion: VERIFIER_VERSION,
      reasons: ["automated checks passed; contract-specific expert review is required"],
      observed,
      resultDigest: "",
      context
    });
  }

  const unsupportedValidator: never = track.validator;
  throw new Error(`unsupported trusted track validator: ${String(unsupportedValidator)}`);
}
