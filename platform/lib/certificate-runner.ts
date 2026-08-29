import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
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
}

const CERTIFICATE_PATHS = [
  "Cargo.toml",
  "Cargo.lock",
  "rust-toolchain.toml",
  "model",
  "src"
];

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

function assertPinnedCertificateTree(root: string, revision: string): void {
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("certificate revision is not a full Git commit id");
  run(root, "git", ["cat-file", "-e", `${revision}^{commit}`]);
  const diff = spawnSync("git", ["diff", "--quiet", revision, "--", ...CERTIFICATE_PATHS], { cwd: root });
  if (diff.error) throw diff.error;
  if (diff.status !== 0) throw new Error("protected certificate sources differ from the frozen certificate revision");
  const untracked = run(root, "git", ["ls-files", "--others", "--exclude-standard", "--", ...CERTIFICATE_PATHS]).trim();
  if (untracked.length > 0) throw new Error("protected certificate sources contain untracked files");
}

export function runCertificate(directory: string, certificateRevision: string): CertificateObservation {
  const root = path.resolve(directory);
  assertPinnedCertificateTree(root, certificateRevision);
  const report = run(root, "cargo", ["run", "--release", "--locked", "--", "--exact"]);
  return {
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
    )
  };
}
