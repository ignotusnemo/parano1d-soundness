# V2 Poseidon2b nonlinear-subspace reproduction contract v2.0.0

## Published target

The target is the nonlinear-subspace specialization of ePrint 2026/1792 computed directly from the Poseidon2b parameters and matrices shipped in v2.0.3. The integrated `noid_soundness` binary reads the production crate; this contract hashes only its complete `POSEIDON2B NONLINEAR SUBSPACE REVIEW` section, including all four exact Macaulay projections.

Production and integrated certificate revision: `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Obtain that complete checkout in addition to the frozen research workspace. The standalone historical calculator in this research repository is not the target.

## Protected execution

A cold verification exports the exact production Git commit into a fresh directory and builds with the pinned Rust toolchain, release mode and `--locked`. It never executes submitted code. Its expected values come from `catalog/tracks/poseidon2b-nonlinear-subspace-reproduction.json`, not from a submission. Optional `PARANO1D_CERTIFICATE_TARGET_DIR` caches trusted Cargo build products. The host may also retain completed protected observations in an operator-owned directory outside contributor workspaces. That cache is keyed by source revision, profile and the complete frozen input manifest. Every submission still checks current input digests, source availability and every observed and submitted field against the protected contract. An altered cache field is rejected. Participants must independently run the reproduction; a hosted cache hit is not another independent execution.

The protected runner executes the current production `noid_soundness` binary with `--exact`, extracts exactly one complete nonlinear-subspace section and checks its SHA-256, rank core, trail lengths and lowest projected attack cost. Other sections of that binary retain a historical aggregate profile and are excluded from this component contract. The joint-bank v2 result is checked by the separate current certificate reproduction task.

Frozen report SHA-256: `9d470579d6275b56a6938db5e87c7d331e7804cc12db45b68625fe0f24dbdc6f`.

## Inputs and reproduction

Follow [the current certificate instructions](../certificates/README.md). Set `PARANO1D_PRODUCTION_DIR` to the exact production Git checkout. From the research directory, generate a submission for `poseidon2b-nonlinear-subspace-reproduction` using `npm run challenge -- setup`, then run `npm run challenge -- verify --submission <directory>`. Automated acceptance requires every observed field and every submitted field to match the frozen contract exactly.

## Effect and limits

The nonzero core is `0000000000000000000000000000be32`, trail lengths are two and four, and the lowest semi-regular projection is `1022.830074998558` bits. This is a scoped component calculation, not a 1022-bit security claim, a universal lower bound or a production reachability witness.

Acceptance creates an attributed reproduction record for `v2-poseidon2b-classical-audit` without a frontier metric. This contract supersedes earlier versions for new work. Previous contracts and accepted records remain available only for historical replay.
