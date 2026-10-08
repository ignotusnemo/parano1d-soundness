# V2 certificate reproduction contract v2.0.0

## Published target

The target is the complete source-linked v2.0.3 joint-bank accounting report. It covers wallet, pre-activation History, v2 History and sparse retirement, using the authenticated mainnet bank and two pinned retirement keys.

Production and integrated certificate revision: `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Obtain that complete checkout in addition to the frozen research workspace. The standalone historical calculator in this research repository is not the target.

## Protected execution

The verifier exports the exact production Git commit into a fresh directory and builds with the pinned Rust toolchain, release mode and `--locked`. It never executes submitted code. Its expected values come from `catalog/tracks/certificate-reproduction.json`, not from a submission. Optional `PARANO1D_CERTIFICATE_TARGET_DIR` caches only trusted Cargo build products; the protected sources are exported again and the calculator is executed for each verification process.

The protected runner verifies the SHA-256 and exact size of all four decompressed inputs, then the production calculator independently verifies their protocol digests and key identities. It checks the complete JSON report hash, activation height 210537, 20-event inventory, bank, runtime and key pins, sequential query cap, limiting event, descriptive gate-depth floor and 90-digit ideal-envelope ceiling.

Frozen report SHA-256: `f99af13256d02f4cbd6554367a234725fc551806a163624e4cc892ccf0abbebd`.

## Inputs and reproduction

Follow [the current certificate instructions](../certificates/README.md). Set `PARANO1D_PRODUCTION_DIR` to the exact production Git checkout. From the research directory, generate a submission for `certificate-reproduction` using `npm run challenge -- setup`, then run `npm run challenge -- verify --submission <directory>`. Automated acceptance requires every observed field and every submitted field to match the frozen contract exactly.

## Effect and limits

A matching result verifies conditional arithmetic and reproducibility. It does not independently regenerate the release matrices or prove honest preprocessing, all-root composition, the concrete compiler, fixed Poseidon2b deviation or universal response-cost minima. Those conditions have separate current v2 review tasks.

Acceptance creates an attributed reproduction record for `v2-joint-bank-accounting` without a frontier metric. This contract supersedes earlier versions for new work. Previous contracts and accepted records remain available only for historical replay.
