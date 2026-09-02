import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export interface CertificateObservation {
  certificateCommit: string;
  productionCommit: string;
  reportSha256: string;
  blockTiwariProvableBits: string;
  sequentialIdealQromBits: string;
  categoryOneGateDepthBits: string;
  categoryOneIdealEnvelope: string;
  poseidonClassicalProjectionBits: string;
  poseidonNonlinearRankCore?: string;
  poseidonLinearTrailRounds?: string;
  poseidonNonlinearTrailRounds?: string;
  poseidonNonlinearProjectionBits?: string;
}

const observationCache = new Map<string, CertificateObservation>();

function run(directory: string, command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: directory,
    encoding: "utf8",
    timeout: 15 * 60 * 1_000,
    maxBuffer: 16 * 1_048_576,
    env: { ...process.env, CARGO_TERM_COLOR: "never" }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function one(report: string, pattern: RegExp, label: string): string {
  const matches = [...report.matchAll(pattern)];
  if (matches.length !== 1 || matches[0]?.[1] === undefined) {
    throw new Error(`certificate report does not contain exactly one ${label}`);
  }
  return matches[0][1];
}

function reportAtRevision(root: string, revision: string): string {
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("certificate revision is not a full Git commit id");
  run(root, "git", ["cat-file", "-e", `${revision}^{commit}`]);
  const directory = mkdtempSync(path.join(tmpdir(), "parano1d-certificate-"));
  try {
    const archive = spawnSync("git", ["archive", "--format=tar", revision], {
      cwd: root,
      maxBuffer: 32 * 1_048_576
    });
    if (archive.error) throw archive.error;
    if (archive.status !== 0) throw new Error(`git archive failed: ${archive.stderr.toString().trim()}`);
    const unpack = spawnSync("tar", ["-xf", "-", "-C", directory], {
      input: archive.stdout,
      maxBuffer: 32 * 1_048_576
    });
    if (unpack.error) throw unpack.error;
    if (unpack.status !== 0) throw new Error(`certificate archive extraction failed: ${unpack.stderr.toString().trim()}`);
    return run(directory, "cargo", ["run", "--release", "--locked", "--", "--exact"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function runCertificate(directory: string, certificateRevision: string): CertificateObservation {
  const root = path.resolve(directory);
  const cacheKey = `${root}:${certificateRevision}`;
  const cached = observationCache.get(cacheKey);
  if (cached) return { ...cached };
  const report = reportAtRevision(root, certificateRevision);
  const nonlinearObservation = report.includes("POSEIDON2B NONLINEAR SUBSPACE REVIEW")
    ? {
        poseidonNonlinearRankCore: one(
          report,
          /^production even-construction rank core: 0x([0-9a-f]{32}) nonzero$/gmu,
          "Poseidon2b nonlinear-subspace rank core"
        ),
        poseidonLinearTrailRounds: one(
          report,
          /^partial-round trails: linear=([0-9]+) nonlinear=[0-9]+ of production RP=[0-9]+$/gmu,
          "Poseidon2b linear-subspace trail length"
        ),
        poseidonNonlinearTrailRounds: one(
          report,
          /^partial-round trails: linear=[0-9]+ nonlinear=([0-9]+) of production RP=[0-9]+$/gmu,
          "Poseidon2b nonlinear-subspace trail length"
        ),
        poseidonNonlinearProjectionBits: one(
          report,
          /^lowest-cost ePrint 2026\/1792 production projection: .+ at ([0-9]+\.[0-9]{12}) bits$/gmu,
          "Poseidon2b nonlinear-subspace projection"
        )
      }
    : {};
  const observation = {
    certificateCommit: certificateRevision,
    productionCommit: one(report, /^source revision: ([0-9a-f]{40})$/gmu, "production revision"),
    reportSha256: createHash("sha256").update(report).digest("hex"),
    blockTiwariProvableBits: one(
      report,
      /^provable descriptive log2\(work\): ([0-9]+\.[0-9]{12})$/gmu,
      "provable FS-FRI result"
    ),
    sequentialIdealQromBits: one(
      report,
      /^descriptive boundary bits: ([0-9]+\.[0-9]{12})$/gmu,
      "sequential ideal-QROM result"
    ),
    categoryOneGateDepthBits: one(
      report,
      /^dominant-term descriptive gate-depth bits: ([0-9]+\.[0-9]{12})$/gmu,
      "Category 1 gate-depth result"
    ),
    categoryOneIdealEnvelope: one(
      report,
      /^complete ideal envelope <= (0\.[0-9]{18})$/gmu,
      "Category 1 ideal envelope"
    ),
    poseidonClassicalProjectionBits: one(
      report,
      /^descriptive log2\(d_I\^2\) dedicated algebraic projection: ([0-9]+\.[0-9]{12})$/gmu,
      "Poseidon2b classical projection"
    ),
    ...nonlinearObservation
  };
  observationCache.set(cacheKey, observation);
  return { ...observation };
}
