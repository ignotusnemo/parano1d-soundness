import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { canonicalJson, digestCanonicalJson } from "@/lib/canonical-json";
import { parseStrictJson } from "@/lib/strict-json";
import type { VerificationContext } from "@/lib/types";

export const DELEGATION_FILE_NAME = "delegation.json";
const identifier = z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/);
const keyId = z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/);
const humanLogin = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/);
const botLogin = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\[bot\]$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);

const delegationSchema = z.object({
  schemaVersion: z.literal(1),
  issuer: z.literal("noid.network"),
  keyId,
  repository: z.literal("ignotusnemo/parano1d-soundness"),
  runId: z.string().uuid(),
  submissionId: identifier,
  issuedAt: z.string().datetime({ offset: true }),
  researcher: z.object({
    githubId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    login: humanLogin
  }).strict(),
  contentDigest: sha256,
  signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/)
}).strict();

const keyDescriptorSchema = z.object({
  schemaVersion: z.literal(1),
  keyId,
  algorithm: z.literal("Ed25519"),
  issuer: z.literal("noid.network"),
  botLogin,
  publicKeySpki: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
  validFrom: z.string().datetime({ offset: true }),
  validUntil: z.string().datetime({ offset: true }).optional()
}).strict();

type ServiceDelegation = z.infer<typeof delegationSchema>;
type ServiceDelegationKey = z.infer<typeof keyDescriptorSchema>;

function loadServiceDelegation(directory: string): ServiceDelegation {
  return delegationSchema.parse(parseStrictJson(readFileSync(path.join(directory, DELEGATION_FILE_NAME), "utf8")));
}

function loadServiceDelegationKey(delegation: ServiceDelegation, keyDirectory: string): ServiceDelegationKey {
  const descriptor = keyDescriptorSchema.parse(parseStrictJson(readFileSync(path.join(keyDirectory, `${delegation.keyId}.json`), "utf8")));
  if (descriptor.keyId !== delegation.keyId || descriptor.issuer !== delegation.issuer) {
    throw new Error("delegation key descriptor does not match its issuer");
  }
  return descriptor;
}

export function serviceDelegationActor(directory: string, keyDirectory: string): string {
  const delegation = loadServiceDelegation(directory);
  return loadServiceDelegationKey(delegation, keyDirectory).botLogin;
}

function fileDigest(filename: string): string {
  return createHash("sha256").update(readFileSync(filename)).digest("hex");
}

export function delegatedContentDigest(directory: string): string {
  const optionalDigest = (name: string): string | null => {
    try {
      return fileDigest(path.join(directory, name));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      throw error;
    }
  };
  return digestCanonicalJson({
    submissionSha256: fileDigest(path.join(directory, "submission.json")),
    reportSha256: optionalDigest("report.md"),
    artifactSha256: optionalDigest("artifact.json")
  });
}

export interface VerifyDelegationOptions {
  directory: string;
  submissionId: string;
  context: VerificationContext;
  checkedAt: string;
  keyDirectory: string;
}

export function verifyServiceDelegation(options: VerifyDelegationOptions): VerificationContext["researcher"] {
  const delegation = loadServiceDelegation(options.directory);
  if (delegation.submissionId !== options.submissionId) throw new Error("delegation names another submission");
  if (delegation.repository !== options.context.repository) throw new Error("delegation names another repository");
  if (delegation.contentDigest !== delegatedContentDigest(options.directory)) throw new Error("delegation does not match the passive submission bytes");
  const descriptor = loadServiceDelegationKey(delegation, options.keyDirectory);
  if (options.context.actor !== descriptor.botLogin) throw new Error("delegation was not submitted by the pinned GitHub App bot");
  const issuedAt = Date.parse(delegation.issuedAt);
  const checkedAt = Date.parse(options.checkedAt);
  if (issuedAt < Date.parse(descriptor.validFrom)) throw new Error("delegation predates its signing key");
  if (descriptor.validUntil && issuedAt > Date.parse(descriptor.validUntil)) throw new Error("delegation postdates its signing key");
  if (issuedAt > checkedAt + 5 * 60 * 1000) throw new Error("delegation issuance time is in the future");
  const { signature, ...signed } = delegation;
  const publicKey = createPublicKey({ key: Buffer.from(descriptor.publicKeySpki, "base64"), format: "der", type: "spki" });
  if (!verify(null, Buffer.from(canonicalJson(signed)), publicKey, Buffer.from(signature, "base64url"))) throw new Error("delegation signature is invalid");
  return {
    githubId: delegation.researcher.githubId,
    login: delegation.researcher.login,
    profileUrl: `https://github.com/${delegation.researcher.login}`,
    avatarUrl: `https://avatars.githubusercontent.com/u/${delegation.researcher.githubId}?v=4`,
    delegation: { issuer: delegation.issuer, keyId: delegation.keyId, runId: delegation.runId }
  };
}
