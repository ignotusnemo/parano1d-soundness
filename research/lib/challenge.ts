import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadTrack } from "@/lib/catalog";
import { parseStrictJson } from "@/lib/strict-json";
import { submissionManifestSchema } from "@/lib/schemas";
import { CERTIFICATE_REVISION, PRODUCTION_REVISION } from "@/lib/pins";
import type { ResearchAttribution, SubmissionManifest } from "@/lib/types";

const submissionIdPattern = /^[a-z0-9][a-z0-9-]{2,79}$/;

export interface ChallengeSetup {
  root: string;
  destination: string;
  id: string;
  trackId: string;
  attribution: ResearchAttribution;
}

function digest(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function challengeReportTemplate(trackTitle: string, trackId: string, targetClaimId: string, productionImpactGate = false): string {
  const productionImpact = productionImpactGate
    ? "\n## Production reachability\n\nDerive every witness input from valid production artifacts or prove why the pinned verifier accepts it. Name every production entry point and immutable source location.\n\n## Accepted production effect\n\nShow the concrete binding, verifier or State violation. Component behavior without this effect is not eligible for submission.\n"
    : "";
  const limits = productionImpactGate
    ? "## Limitations\n\nState the exact boundary of the conclusive result. Do not include a failed search or component-only observation as the claimed result.\n"
    : "## Limits and negative results\n\nState what the result does not prove. Record failed approaches when they are useful to later researchers.\n";
  return `# ${trackTitle}\n\n## Claimed result\n\nState one exact result. Name the security game, model, units and direction of the claimed frontier movement.\n\n## Method\n\nGive the complete argument, construction, attack or audit method. Distinguish proved statements, measured results and assumptions.\n\n## Production target\n\nTrack: \`${trackId}\`\n\nTarget claim: \`${targetClaimId}\`\n\nProduction commit: \`${PRODUCTION_REVISION}\`\n\nCertificate commit: \`${CERTIFICATE_REVISION}\`\n${productionImpact}\n## Reproduction\n\nGive exact commands, artifact commits, inputs and expected outputs needed for an independent reproduction. If a passive structured witness is included, place it in \`artifact.json\` and run the seal command again.\n\n${limits}\n## Sources\n\nList primary papers, theorem sections, source files and immutable artifact links.\n`;
}

function manifestFor(setup: ChallengeSetup): { manifest: SubmissionManifest; report?: string } {
  const track = loadTrack(setup.root, setup.trackId);
  if (track.id === "official-certificate" || track.state !== "active") throw new Error("the selected track is not open to public submissions");
  if (!submissionIdPattern.test(setup.id)) throw new Error("submission id must contain lowercase letters, digits and hyphens");

  if (track.validator === "certificate-reproduction") {
    if (!track.expected) throw new Error("reproduction track has no frozen expected values");
    return {
      manifest: submissionManifestSchema.parse({
        schemaVersion: 1,
        id: setup.id,
        track: track.id,
        contractVersion: track.contractVersion,
        title: `Independent reproduction ${setup.id}`,
        note: "Independent execution of the protected source-pinned certificate. This submission checks reproducibility and does not claim a stronger security bound.",
        attribution: setup.attribution,
        payload: track.expected
      })
    };
  }

  if (track.validator !== "manual-audit") throw new Error("the selected track does not yet have an active submission verifier");
  const report = challengeReportTemplate(track.title, track.id, track.targetClaimId, track.submissionPolicy?.evidenceSchema === "poseidon2b-production-impact-v1");
  return {
    report,
    manifest: submissionManifestSchema.parse({
      schemaVersion: 1,
      id: setup.id,
      track: track.id,
      contractVersion: track.contractVersion,
      title: `${track.title}: ${setup.id}`,
      note: "Source-pinned research submission prepared against the active contract. The claimed result, method, reproducibility instructions and limitations are recorded in report.md.",
      attribution: setup.attribution,
      payload: {
        productionCommit: PRODUCTION_REVISION,
        certificateCommit: CERTIFICATE_REVISION,
        reportPath: "report.md",
        reportSha256: digest(report),
        affectedClaimId: track.targetClaimId,
        finding: track.submissionPolicy?.allowedFindings[0] ?? "inconclusive"
      }
    })
  };
}

export function createChallengeSubmission(setup: ChallengeSetup): string[] {
  if (existsSync(setup.destination)) throw new Error(`destination already exists: ${setup.destination}`);
  const generated = manifestFor(setup);
  mkdirSync(setup.destination, { recursive: false });
  const files: string[] = [];
  const manifestPath = path.join(setup.destination, "submission.json");
  writeFileSync(manifestPath, `${JSON.stringify(generated.manifest, null, 2)}\n`, { flag: "wx" });
  files.push(manifestPath);
  if (generated.report !== undefined) {
    const reportPath = path.join(setup.destination, "report.md");
    writeFileSync(reportPath, generated.report, { flag: "wx" });
    files.push(reportPath);
  }
  return files;
}

export function sealChallengeSubmission(directory: string): SubmissionManifest {
  const manifestPath = path.join(directory, "submission.json");
  const manifest = submissionManifestSchema.parse(parseStrictJson(readFileSync(manifestPath, "utf8")));
  if (manifest.payload.reportPath !== "report.md") return manifest;
  const reportPath = path.join(directory, "report.md");
  manifest.payload.reportSha256 = digest(readFileSync(reportPath));
  const artifactPath = path.join(directory, "artifact.json");
  if (existsSync(artifactPath)) {
    parseStrictJson(readFileSync(artifactPath, "utf8"));
    manifest.payload.artifactPath = "artifact.json";
    manifest.payload.artifactSha256 = digest(readFileSync(artifactPath));
  } else {
    delete manifest.payload.artifactPath;
    delete manifest.payload.artifactSha256;
  }
  const sealed = submissionManifestSchema.parse(manifest);
  writeFileSync(manifestPath, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "w" });
  return sealed;
}
