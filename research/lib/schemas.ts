import { z } from "zod";
import { CLAIM_STATUSES } from "@/lib/types";

const identifier = z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/);
const metricIdentifier = z.string().regex(/^[a-z0-9][a-z0-9.-]{2,119}$/);
const providerIdentifier = z.string().regex(/^[a-z0-9][a-z0-9.-]{1,79}$/);
const modelIdentifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{1,119}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);
const githubHumanLogin = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/);
const githubActorLogin = z.string().regex(/^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})|[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\[bot\])$/);
const safeTitle = z.string().min(8).max(160).regex(/^[^\u0000-\u001f<>]+$/u);
const safeNote = z.string().min(40).max(8_000).refine((value) => !/[<>]/u.test(value), {
  message: "HTML is not permitted in submission notes"
});

export const serviceReviewAttestationSchema = z.object({
  schemaVersion: z.literal(1),
  issuer: z.literal("noid.network"),
  keyId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
  repository: z.literal("ignotusnemo/parano1d-soundness"),
  runId: z.string().uuid(),
  submissionId: identifier,
  sourceCommit: gitCommit,
  issuedAt: z.string().datetime({ offset: true }),
  reviewer: z.object({
    githubId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    login: githubHumanLogin
  }).strict(),
  decisionDigest: sha256,
  signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/)
}).strict();
const modelAttributionSchema = z
  .object({
    provider: providerIdentifier,
    model: modelIdentifier,
    displayName: z.string().min(2).max(80).regex(/^[^\u0000-\u001f<>]+$/u),
    agent: z.string().min(2).max(80).regex(/^[^\u0000-\u001f<>]+$/u).optional()
  })
  .strict();
const researchAttributionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("human") }).strict(),
  z.object({ mode: z.literal("ai-assisted"), model: modelAttributionSchema }).strict()
]);

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
          role: z.enum(["required", "premise", "context"]),
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
    direction: z.enum(["maximize", "minimize", "bidirectional", "non-ranked"]),
    targetClaimId: identifier,
    contractVersion: z.string().min(3).max(40),
    validator: z.enum(["certificate-reproduction", "manual-audit"]),
    state: z.enum(["active", "contract-draft"]),
    acceptance: z.string().min(20).max(1_000),
    contractUrl: z.string().url().optional(),
    scoreMetricId: metricIdentifier.optional(),
    expected: z.record(z.string(), z.string()).optional(),
    reviewPolicy: z
      .object({
        minimumApprovals: z.number().int().min(2).max(8),
        minimumIndependentApprovals: z.number().int().min(1).max(7),
        maintainerLogins: z.array(z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/)).min(1).max(20),
        statusRules: z.object({
          supports: z.array(z.enum(["verified", "proved", "premise"])).min(1).max(3),
          challenges: z.array(z.enum(["premise", "refuted"])).min(1).max(2)
        }).strict(),
        metricRules: z.array(
          z.object({
            id: metricIdentifier,
            kind: z.enum(["lower-bound", "upper-bound", "probability-upper-bound", "resource-count", "reference"]),
            direction: z.enum(["maximize", "minimize"]),
            unit: z.string().min(1).max(80),
            valueFormat: z.enum(["non-negative-integer", "non-negative-decimal", "unit-interval-decimal"])
          }).strict()
        ).max(20)
      })
      .strict()
      .optional()
  })
  .strict()
  .superRefine((track, context) => {
    if (track.validator === "manual-audit" && !track.reviewPolicy) {
      context.addIssue({ code: "custom", message: "manual review tracks require a reviewPolicy", path: ["reviewPolicy"] });
    }
    if (track.validator !== "manual-audit" && track.reviewPolicy) {
      context.addIssue({ code: "custom", message: "automatic tracks cannot declare a reviewPolicy", path: ["reviewPolicy"] });
    }
    if (track.reviewPolicy && track.reviewPolicy.minimumIndependentApprovals >= track.reviewPolicy.minimumApprovals) {
      context.addIssue({ code: "custom", message: "review policy must reserve at least one maintainer approval", path: ["reviewPolicy"] });
    }
    if (track.reviewPolicy) {
      const metricIds = new Set<string>();
      for (const [index, rule] of track.reviewPolicy.metricRules.entries()) {
        if (metricIds.has(rule.id)) context.addIssue({ code: "custom", message: `duplicate review metric rule ${rule.id}`, path: ["reviewPolicy", "metricRules", index] });
        metricIds.add(rule.id);
        if (rule.direction === "maximize" && rule.kind !== "lower-bound") {
          context.addIssue({ code: "custom", message: "a maximized frontier metric must be a lower bound", path: ["reviewPolicy", "metricRules", index] });
        }
        if (rule.direction === "minimize" && !["upper-bound", "probability-upper-bound", "resource-count"].includes(rule.kind)) {
          context.addIssue({ code: "custom", message: "a minimized frontier metric must be an upper bound or resource count", path: ["reviewPolicy", "metricRules", index] });
        }
      }
      if (track.scoreMetricId && !metricIds.has(track.scoreMetricId)) {
        context.addIssue({ code: "custom", message: "scoreMetricId must have a frozen review metric rule", path: ["scoreMetricId"] });
      }
    }
  });

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
    attribution: researchAttributionSchema,
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
    effects: z.array(effectSchema).max(20)
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
    attribution: researchAttributionSchema,
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
    artifactPath: z.literal("artifact.json").optional(),
    artifactSha256: sha256.optional(),
    affectedClaimId: identifier,
    finding: z.enum(["supports", "challenges", "inconclusive"])
  })
  .strict()
  .refine((value) => Boolean(value.artifactPath) === Boolean(value.artifactSha256), {
    message: "artifactPath and artifactSha256 must be declared together"
  });

export const verificationContextSchema = z
  .object({
    repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
    commit: gitCommit,
    actor: githubActorLogin,
    pullRequest: z.number().int().positive().optional(),
    researcher: z.object({
      githubId: z.string().regex(/^[1-9][0-9]{0,19}$/),
      login: githubHumanLogin,
      profileUrl: z.string().url(),
      avatarUrl: z.string().url(),
      delegation: z.object({
        issuer: z.literal("noid.network"),
        keyId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
        runId: z.string().uuid()
      }).strict()
    }).strict().optional()
  })
  .strict();

export const reviewDecisionSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: identifier,
    submissionId: identifier,
    trackId: identifier,
    reviewedFinding: z.enum(["supports", "challenges", "inconclusive"]).optional(),
    acceptedAt: z.string().datetime({ offset: true }),
    verificationCheckedAt: z.string().datetime({ offset: true }),
    verificationResultDigest: sha256,
    note: safeNote,
    context: verificationContextSchema.refine((value) => value.pullRequest !== undefined, {
      message: "reviewed decisions require a pull request"
    }),
    attestation: serviceReviewAttestationSchema.optional(),
    reviewers: z.array(
      z.object({
        login: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
        role: z.enum(["maintainer", "independent"]),
        reviewUrl: z.string().url().max(500)
      }).strict()
    ).max(8),
    effects: z.array(effectSchema).max(20)
  })
  .strict();
