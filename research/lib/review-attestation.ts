import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { canonicalJson, digestCanonicalJson } from "@/lib/canonical-json";
import { serviceReviewAttestationSchema } from "@/lib/schemas";
import { parseStrictJson } from "@/lib/strict-json";
import type { ReviewDecision, ServiceReviewAttestation } from "@/lib/types";

const keyDescriptorSchema = z.object({
  schemaVersion: z.literal(1),
  keyId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
  algorithm: z.literal("Ed25519"),
  issuer: z.literal("noid.network"),
  purpose: z.literal("maintainer-review"),
  publicKeySpki: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
  validFrom: z.string().datetime({ offset: true }),
  validUntil: z.string().datetime({ offset: true }).optional()
}).strict();

function decisionWithoutAttestation(decision: ReviewDecision): Omit<ReviewDecision, "attestation"> {
  const { attestation: _attestation, ...unsigned } = decision;
  return unsigned;
}

export function reviewDecisionDigest(decision: ReviewDecision): string {
  return digestCanonicalJson(decisionWithoutAttestation(decision));
}

export interface CreateReviewAttestationInput {
  keyId: string;
  privateKeyPem: string;
  runId: string;
  reviewer: { githubId: string; login: string };
  issuedAt: string;
}

export function createServiceReviewAttestation(
  decision: ReviewDecision,
  input: CreateReviewAttestationInput
): ServiceReviewAttestation {
  if (decision.attestation) throw new Error("review decision is already attested");
  const unsigned = serviceReviewAttestationSchema.omit({ signature: true }).parse({
    schemaVersion: 1,
    issuer: "noid.network",
    keyId: input.keyId,
    repository: decision.context.repository,
    runId: input.runId,
    submissionId: decision.submissionId,
    sourceCommit: decision.context.commit,
    issuedAt: input.issuedAt,
    reviewer: input.reviewer,
    decisionDigest: reviewDecisionDigest(decision)
  });
  const privateKey = createPrivateKey(input.privateKeyPem);
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("review attestation key is not Ed25519");
  return serviceReviewAttestationSchema.parse({
    ...unsigned,
    signature: sign(null, Buffer.from(canonicalJson(unsigned)), privateKey).toString("base64url")
  });
}

export function verifyServiceReviewAttestation(decision: ReviewDecision, keyDirectory: string): ServiceReviewAttestation["reviewer"] {
  const attestation = serviceReviewAttestationSchema.parse(decision.attestation);
  if (attestation.submissionId !== decision.submissionId) throw new Error("review attestation names another submission");
  if (attestation.repository !== decision.context.repository) throw new Error("review attestation names another repository");
  if (attestation.sourceCommit !== decision.context.commit) throw new Error("review attestation names another source commit");
  if (decision.context.researcher?.delegation.runId !== attestation.runId) throw new Error("review attestation names another research run");
  if (attestation.issuedAt !== decision.acceptedAt) throw new Error("review attestation time differs from the accepted decision time");
  if (attestation.decisionDigest !== reviewDecisionDigest(decision)) throw new Error("review attestation does not match the decision");
  const descriptor = keyDescriptorSchema.parse(parseStrictJson(readFileSync(path.join(keyDirectory, `${attestation.keyId}.json`), "utf8")));
  if (descriptor.keyId !== attestation.keyId || descriptor.issuer !== attestation.issuer) throw new Error("review attestation key descriptor does not match its issuer");
  const issuedAt = Date.parse(attestation.issuedAt);
  if (issuedAt < Date.parse(descriptor.validFrom)) throw new Error("review attestation predates its signing key");
  if (descriptor.validUntil && issuedAt > Date.parse(descriptor.validUntil)) throw new Error("review attestation postdates its signing key");
  const { signature, ...signed } = attestation;
  const publicKey = createPublicKey({ key: Buffer.from(descriptor.publicKeySpki, "base64"), format: "der", type: "spki" });
  if (!verify(null, Buffer.from(canonicalJson(signed)), publicKey, Buffer.from(signature, "base64url"))) throw new Error("review attestation signature is invalid");
  return attestation.reviewer;
}
