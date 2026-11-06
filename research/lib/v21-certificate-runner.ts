import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseStrictJson } from "@/lib/strict-json";
import { v21ReproductionPayloadSchema } from "@/lib/schemas";

export const V21_PRODUCTION_REVISION = "848209d5db75137483cb41a94b310ad11463473f";
export const V21_CERTIFICATE_REVISION = "7ead11a3afb452fb14eea505cfa913ce20a87f9a";

function run(cwd: string, command: string, args: string[], input?: Buffer): Buffer {
  const result = spawnSync(command, args, { cwd, input, timeout: 60_000, maxBuffer: 32 * 1_048_576 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`protected ${command} failed: ${result.stderr.toString().slice(-2_000)}`);
  return result.stdout;
}

export function v21Observation(report: string, revision: string): Record<string, string> {
  const parsed = parseStrictJson(report) as Record<string, any>;
  if (parsed.profile !== "mainnet-v21" || parsed.production_commit !== V21_PRODUCTION_REVISION || !Array.isArray(parsed.events)) throw new Error("invalid v2.1 protected report");
  return v21ReproductionPayloadSchema.parse({
    profile: "mainnet-v21", certificateCommit: revision, productionCommit: parsed.production_commit,
    reportSha256: createHash("sha256").update(report).digest("hex"), profileSha256: parsed.profile_sha256,
    bankDigest: parsed.bank, predecessorBankDigest: parsed.predecessor_bank, legacyRuntimeDigest: parsed.legacy_runtime,
    activationHeight: String(parsed.activation_height), classCount: String(parsed.class_count),
    retainedEventCount: String(parsed.retained_event_count), addedEventCount: String(parsed.added_event_count),
    eventCount: String(parsed.events.length), categoryOneGateDepthBits: parsed.resource_work_floor_bits,
    categoryOneIdealEnvelope: parsed.category_one_ideal_envelope.upper_decimal,
    sequentialLargestQueryCap: parsed.sequential_largest_query_cap, limitingEvent: parsed.resource_limiting_event
  });
}

export function runV21Certificate(repository: string, revision: string): Record<string, string> {
  if (revision !== V21_CERTIFICATE_REVISION) throw new Error("unsupported protected v2.1 certificate revision");
  const directory = mkdtempSync(path.join(tmpdir(), "noid-v21-certificate-"));
  try {
    // The archive and calculator come from the trusted owner repository.
    // Submitted files and the live working tree supply no executable inputs.
    const archive = run(repository, "git", ["archive", "--format=tar", revision]);
    run(repository, "tar", ["-xf", "-", "-C", directory], archive);
    const report = run(directory, "python3", ["-I", "-B", "research/tools/v21_certificate.py", "--json"]).toString("utf8");
    return v21Observation(report, revision);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
