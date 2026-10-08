import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { v2ReproductionPayloadSchema, v2PoseidonReproductionPayloadSchema } from "@/lib/schemas";
import { parseStrictJson } from "@/lib/strict-json";

export const V2_CERTIFICATE_REVISION = "50d6dac5a37b9f1be425b5e6cd823de48f843b50";
export const V2_INPUTS = [
  { name: "history-step.runtime", bytes: 2214607, sha256: "8fab1225073d658bc1988573c79b0520ce141d2ac4a0e7c8cc2562be0e6767a5", pin: "ad463bd76e27df3c0f414f4fd7640cfb5c45cc7f3a09e44a2f7bc7a8b869485b" },
  { name: "v2-runtime-metadata.bin", bytes: 2258540, sha256: "04e969990958520dbc865e0fddb8ef946dae23f670dc9cb56efaadc5ccebfed2", pin: "c2a6df736b0d0da22e285b6930b11cf44b520d65b52c7dfe78f44fe0cd48e76e" },
  { name: "class-0.key", bytes: 304, sha256: "02421f91a13d34480e71e3f8a88071d7e8dcb10ac9ca2339f8a2dea7cb8a689c", pin: "0651ce507810b61213cbdc0e9f99436aec3a7922cc662bfba6128b466453c8b2" },
  { name: "class-1.key", bytes: 304, sha256: "c655cbb3c3f485b3654d4a0c5d69f108eda504a3a34769a5579aad1fe3b9e8c8", pin: "c301274d50dc02fd5c383f2e71629075729a954a768f5051388ec2040bce0267" }
] as const;
export type V2CertificateProfile = "mainnet-v2" | "mainnet-v2-poseidon2b";
const observations = new Map<string, Record<string, string>>();
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

function observationSchema(profile: V2CertificateProfile) {
  return profile === "mainnet-v2" ? v2ReproductionPayloadSchema : v2PoseidonReproductionPayloadSchema;
}

function observationFile(directory: string, revision: string, profile: V2CertificateProfile): string {
  const key = digest(JSON.stringify({ version: 1, revision, profile, inputs: V2_INPUTS }));
  return path.join(directory, `${key}.json`);
}

// Optional operator-owned cache, outside all contributor workspaces. The caller
// still compares every field with the protected contract on every submission.
export function readV2ObservationCache(directory: string, revision: string, profile: V2CertificateProfile): Record<string, string> | undefined {
  const filename = observationFile(directory, revision, profile);
  if (!existsSync(filename)) return undefined;
  const stat = lstatSync(filename);
  if (!stat.isFile() || stat.size > 16_384) throw new Error("invalid protected observation cache file");
  const observed = observationSchema(profile).parse(parseStrictJson(readFileSync(filename, "utf8")));
  if (observed.certificateCommit !== revision || observed.productionCommit !== revision) throw new Error("protected observation cache revision mismatch");
  return observed;
}

export function writeV2ObservationCache(directory: string, revision: string, profile: V2CertificateProfile, value: Record<string, string>): void {
  const observed = observationSchema(profile).parse(value);
  if (observed.certificateCommit !== revision || observed.productionCommit !== revision) throw new Error("protected observation cache revision mismatch");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = observationFile(directory, revision, profile);
  const temporary = `${filename}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(observed)}\n`, { mode: 0o600, flag: "wx" });
    renameSync(temporary, filename);
  } finally { rmSync(temporary, { force: true }); }
}

// These inputs come from the protected workspace, never the submitted artifact.
// The calculator separately authenticates each protocol pin after this SHA check.
export function readV2Inputs(root: string): Buffer[] {
  return V2_INPUTS.map((input) => {
    const filename = path.join(root, "certificates/v2.0.3", `${input.name}.gz`);
    const stat = lstatSync(filename);
    if (!stat.isFile() || stat.size > 1_048_576) throw new Error(`invalid protected input ${input.name}`);
    const bytes = gunzipSync(readFileSync(filename), { maxOutputLength: input.bytes });
    if (bytes.length !== input.bytes || digest(bytes) !== input.sha256) throw new Error(`protected input digest mismatch: ${input.name}`);
    return bytes;
  });
}

function execute(directory: string, command: string, args: string[], environment = process.env): string {
  const result = spawnSync(command, args, {
    cwd: directory, encoding: "utf8", timeout: 9 * 60_000, maxBuffer: 16 * 1_048_576,
    env: { ...environment, CARGO_TERM_COLOR: "never", CARGO_BUILD_JOBS: "2" }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.trim().slice(-8_000)}`);
  return result.stdout;
}

export function v2Observation(report: string, revision: string): Record<string, string> {
  const parsed = JSON.parse(report);
  if (!Array.isArray(parsed.events) || !Array.isArray(parsed.retirement) || parsed.retirement.length !== 2 || typeof parsed.resource_work_floor_bits !== "number" || !Number.isFinite(parsed.resource_work_floor_bits)) throw new Error("invalid v2 calculator report");
  return {
    profile: "mainnet-v2", certificateCommit: revision, productionCommit: revision,
    reportSha256: digest(report), bankDigest: parsed.bank, legacyRuntimeDigest: parsed.legacy_runtime,
    retirementKey0: parsed.retirement[0].key, retirementKey1: parsed.retirement[1].key,
    activationHeight: String(parsed.activation_height), eventCount: String(parsed.events.length),
    categoryOneGateDepthBits: String(parsed.resource_work_floor_bits),
    categoryOneIdealEnvelope: parsed.category_one_ideal_envelope.upper_decimal,
    sequentialLargestQueryCap: parsed.sequential_largest_query_cap, limitingEvent: parsed.resource_limiting_event
  };
}

export function v2PoseidonObservation(report: string, revision: string): Record<string, string> {
  const matches = [...report.matchAll(/^(POSEIDON2B NONLINEAR SUBSPACE REVIEW\n[\s\S]*?^scope: omega=2[^\n]*\n)/gm)];
  if (matches.length !== 1) throw new Error("missing unique production nonlinear-subspace report");
  const section = matches[0]![1]!;
  const one = (pattern: RegExp) => {
    const values = [...section.matchAll(pattern)];
    if (values.length !== 1 || !values[0]?.[1]) throw new Error("invalid production nonlinear-subspace observation");
    return values[0][1];
  };
  return {
    profile: "mainnet-v2-poseidon2b", certificateCommit: revision, productionCommit: revision,
    reportSha256: digest(section),
    poseidonNonlinearRankCore: one(/^production even-construction rank core: 0x([0-9a-f]{32}) nonzero$/gm),
    poseidonLinearTrailRounds: one(/^partial-round trails: linear=([0-9]+) nonlinear=[0-9]+ of production RP=[0-9]+$/gm),
    poseidonNonlinearTrailRounds: one(/^partial-round trails: linear=[0-9]+ nonlinear=([0-9]+) of production RP=[0-9]+$/gm),
    poseidonNonlinearProjectionBits: one(/^lowest-cost ePrint 2026\/1792 production projection: .+ at ([0-9]+\.[0-9]{12}) bits$/gm)
  };
}

export function runV2Certificate(root: string, revision: string, profile: V2CertificateProfile): Record<string, string> {
  if (revision !== V2_CERTIFICATE_REVISION) throw new Error("unsupported protected v2 certificate revision");
  const production = process.env.PARANO1D_PRODUCTION_DIR;
  if (!production) throw new Error("PARANO1D_PRODUCTION_DIR must point to the pinned Parano1d production Git repository");
  const inputs = profile === "mainnet-v2" ? readV2Inputs(root) : [];
  execute(production, "git", ["cat-file", "-e", `${revision}^{commit}`]);
  const observationDirectory = process.env.PARANO1D_CERTIFICATE_OBSERVATIONS_DIR;
  if (observationDirectory) {
    const cached = readV2ObservationCache(observationDirectory, revision, profile);
    if (cached) return { ...cached };
  }
  const cacheKey = `${path.resolve(root)}:${path.resolve(production)}:${revision}:${profile}`;
  const previous = observations.get(cacheKey);
  if (previous) return { ...previous };
  const directory = mkdtempSync(path.join(tmpdir(), "parano1d-v2-certificate-"));
  try {
    const archive = spawnSync("git", ["archive", "--format=tar", revision], { cwd: production, maxBuffer: 64 * 1_048_576, timeout: 30_000 });
    if (archive.error) throw archive.error;
    if (archive.status !== 0) throw new Error(`pinned production archive failed: ${archive.stderr.toString().trim()}`);
    const unpack = spawnSync("tar", ["-xf", "-", "-C", directory], { input: archive.stdout, maxBuffer: 1_048_576, timeout: 30_000 });
    if (unpack.error) throw unpack.error;
    if (unpack.status !== 0) throw new Error("pinned production archive extraction failed");
    const environment = { ...process.env, CARGO_TARGET_DIR: process.env.PARANO1D_CERTIFICATE_TARGET_DIR ? path.join(process.env.PARANO1D_CERTIFICATE_TARGET_DIR, revision) : path.join(directory, ".certificate-target") };
    let observed: Record<string, string>;
    if (profile === "mainnet-v2") {
      const args = V2_INPUTS.flatMap((input, index) => {
        const filename = path.join(directory, `.certificate-${input.name}`);
        writeFileSync(filename, inputs[index]!, { flag: "wx", mode: 0o600 });
        return [filename, input.pin];
      });
      const report = execute(directory, "cargo", ["run", "--release", "--locked", "-p", "bench_prover", "--bin", "noid_v2_soundness", "--", ...args], environment);
      observed = v2Observation(report, revision);
    } else {
      const report = execute(directory, "cargo", ["run", "--release", "--locked", "-p", "noid_soundness", "--", "--exact"], environment);
      observed = v2PoseidonObservation(report, revision);
    }
    observations.set(cacheKey, observed);
    if (observationDirectory) writeV2ObservationCache(observationDirectory, revision, profile, observed);
    return { ...observed };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
