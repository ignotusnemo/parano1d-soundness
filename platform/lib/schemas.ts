import { z } from "zod";
import { CLAIM_STATUSES } from "@/lib/types";

const identifier = z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/);
const metricIdentifier = z.string().regex(/^[a-z0-9][a-z0-9.-]{2,119}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);
const safeTitle = z.string().min(8).max(160).regex(/^[^\u0000-\u001f<>]+$/u);
const safeNote = z.string().min(40).max(8_000).refine((value) => !/[<>]/u.test(value), {
  message: "HTML is not permitted in submission notes"
});

export const metricSchema = z
  .object({
    id: metricIdentifier,
    label: z.string().min(3).max(120),
    value: z.string().min(1).max(10_000),
    unit: z.string().min(1).max(80),
    kind: z.enum(["lower-bound", "upper-bound", "probability-upper-bound", "resource-count", "reference"]),
    scope: z.string().min(3).max(500),
    exact: z.string().min(1).max(100_000).optional()
  })
  .strict();

export const claimSchema = z
  .object({
    id: identifier,
    title: z.string().min(3).max(160),
    statement: z.string().min(20).max(2_000),
    scope: z.string().min(10).max(1_000),
    initialStatus: z.enum(CLAIM_STATUSES),
    derived: z.boolean(),
    dependencies: z.array(
      z
        .object({
          claimId: identifier,
          role: z.enum(["required", "context"]),
          note: z.string().min(3).max(500)
        })
        .strict()
    ),
    sources: z.array(
      z
        .object({
          label: z.string().min(2).max(120),
          url: z.string().url()
        })
        .strict()
    )
  })
  .strict();

export const trackSchema = z
  .object({
    id: identifier,
    title: z.string().min(3).max(160),
    description: z.string().min(20).max(1_000),
    kind: z.enum(["proof", "attack", "audit", "reproduction"]),
    direction: z.enum(["maximize", "minimize", "non-ranked"]),
    targetClaimId: identifier,
    contractVersion: z.string().min(3).max(40),
    validator: z.enum([
      "certificate-reproduction",
      "reserved-formal-proof",
      "reserved-attack-witness",
      "manual-audit"
    ]),
    state: z.enum(["active", "contract-draft"]),
    acceptance: z.string().min(20).max(1_000),
    contractUrl: z.string().url().optional(),
    scoreMetricId: metricIdentifier.optional(),
    expected: z.record(z.string(), z.string()).optional()
  })
  .strict();

export const effectSchema = z
  .object({
    claimId: identifier,
    status: z.enum(CLAIM_STATUSES),
    metrics: z.array(metricSchema)
  })
  .strict();

export const evidenceRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: identifier,
    recordType: z.enum(["official-baseline", "accepted-submission"]),
    trackId: identifier,
    acceptedAt: z.string().datetime({ offset: true }),
    title: safeTitle,
    note: z.string().min(20).max(8_000),
    source: z
      .object({
        repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
        commit: gitCommit,
        url: z.string().url(),
        authorLogin: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
        authorUrl: z.string().url(),
        avatarUrl: z.string().url(),
        pullRequest: z.number().int().positive().optional()
      })
      .strict(),
    verification: z
      .object({
        verifier: z.string().min(3).max(120),
        verifierVersion: z.string().min(1).max(120),
        resultDigest: sha256,
        status: z.literal("accepted")
      })
      .strict(),
    effects: z.array(effectSchema).min(1)
  })
  .strict();

export const submissionManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: identifier,
    track: identifier,
    contractVersion: z.string().min(3).max(40),
    title: safeTitle,
    note: safeNote,
    payload: z.record(z.string(), z.unknown())
  })
  .strict();

export const reproductionPayloadSchema = z
  .object({
    certificateCommit: gitCommit,
    productionCommit: gitCommit,
    reportSha256: sha256,
    blockTiwariProvableBits: z.string().regex(/^[0-9]+\.[0-9]{12}$/),
    sequentialIdealQromBits: z.string().regex(/^[0-9]+\.[0-9]{12}$/),
    categoryOneGateDepthBits: z.string().regex(/^[0-9]+\.[0-9]{12}$/),
    categoryOneIdealEnvelope: z.string().regex(/^0\.[0-9]{18}$/),
    poseidonClassicalProjectionBits: z.string().regex(/^[0-9]+\.[0-9]{12}$/)
  })
  .strict();

export const manualAuditPayloadSchema = z
  .object({
    productionCommit: gitCommit,
    certificateCommit: gitCommit,
    reportPath: z.string().regex(/^report\.md$/),
    reportSha256: sha256,
    affectedClaimId: identifier,
    finding: z.enum(["supports", "challenges", "inconclusive"])
  })
  .strict();

export const verificationContextSchema = z
  .object({
    repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
    commit: gitCommit,
    actor: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
    pullRequest: z.number().int().positive().optional()
  })
  .strict();
