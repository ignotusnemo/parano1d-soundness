# October 2026 certificate refresh

## Reproduced targets

This maintainer refresh by ignotusnemo, assisted by Codex, records the September matrix-provenance audit and repeats its calculations on October 8, 2026. It adds evidence and current research targets. It does not change consensus parameters or claim a new security improvement.

There are two distinct profiles. The standalone certificate at `5e6951555dd67d37ede40b6e272561cd7022089d` still models the historical Parano1d v1.0.4 production commit `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`. The integrated v2 calculator and release inputs are pinned to Parano1d v2.0.3 commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. Their results must not be combined into one frontier or described as the same production snapshot.

The [September report](september-2026-eprint-review.md) first recorded the matrix comparison and the v2 rerun against v2.0.0. The [reproduction manifest](../research/evidence/artifacts/2026-10-08/reproduction.json) records today's source revisions, input hashes, protocol pins, test counts and negative controls. The earlier nonlinear-subspace audit is already in the accepted ledger and is not being resubmitted.

## Legacy certificate renewal

The standalone release test suite passed all 42 tests. `cargo run --release --locked -- --exact` produced [this complete report](../research/evidence/artifacts/2026-10-08/standalone-exact.txt), SHA-256 `44c68fab770d5ad1942fc719596af1484f4f680021a70b96a4fa64b76a700506`. The output now includes September's resultant screening. The legacy dominant work floor remains `173.391078499301` descriptive bits and the ideal Category 1 envelope remains `0.049330348228363684`. The numerical result did not improve.

Active legacy contracts are renewed to that certificate revision. Earlier source pairs and contract versions remain archived for exact replay, including Andy's accepted live-suffix audit. This renewal does not extend that audit to v2.

## Matrix and round-constant correspondence

All 264 round constants, 16 external-matrix entries and 16 internal-matrix entries in the v2.0.3 production permutation match the [authors' reference](https://github.com/Poseidon-Hash/Poseidon2b/blob/7072a9438cf48f1b38ad0092cda5452626914068/binius_poseidon2b/crates/circuits/src/hades/poseidon2b_x7_128_512.rs) at commit `7072a9438cf48f1b38ad0092cda5452626914068`. The reference file has SHA-256 `6a32a107ab40974d259aa0bdd9a11df62c7f42ecd44f48d905b614d0b958fa88`.

The comparison reads literal arrays as passive data and never executes the reference code. Read production `ROUND_CONSTANTS`, `MDS_FULL` and `MDS_PARTIAL`, and reference `RC`, `MDS_FULL` and `MDS_PARTIAL`. Preserve row-major order, require counts 264, 16 and 16, compare every integer, then encode each value as a 16-byte little-endian integer. SHA-256 of the concatenated 296 values is `f7b7ea4bae01d0a62c1d51372046325b4781c641b0ce395ced5ab16c510e6e9b`. The [comparison artifact](../research/evidence/artifacts/2026-10-08/matrix-reference-check.json) also records per-array hashes.

The integrated release test `production_constants_match_the_pinned_poseidon2b_reference` passed. This establishes exact correspondence with the public reference. It does not establish that the reference has no weakness or discharge the fixed-Poseidon2b compiler premise. The matrix-selection attacks discussed in September require separate fixed-instance and production-reachability evidence.

## Current v2 joint-bank accounting

All 41 integrated `noid_soundness` release tests passed. The `noid_v2_soundness` binary was rebuilt from v2.0.3 with the lockfile. It consumed the authenticated release packs, legacy runtime, v2 runtime and both independently pinned retirement keys listed in the manifest. Three negative controls rejected an incorrect v2 bank pin and either incorrect retirement-key pin before printing a result.

The [complete exact v2 report](../research/evidence/artifacts/2026-10-08/v2-soundness-mainnet.json) has SHA-256 `f99af13256d02f4cbd6554367a234725fc551806a163624e4cc892ccf0abbebd`, identical to the mainnet result recorded in September. It inventories 20 typed events across wallet authorization, legacy History, v2 History and sparse matrix retirement. The limiting event is `retirement.b25.query`; the dominant half-success work floor is `173.3897612554174` descriptive gate-depth bits; the complete ideal Category 1 envelope is approximately `0.04937388373372754`.

This is conditional source-linked accounting. Its all-root composition, concrete compiler, fixed-Poseidon2b deviation, response-price and honest public preprocessing conditions remain explicit in [v2-retirement.md](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_soundness/docs/v2-retirement.md). Matching pins authenticates the selected inputs; this rerun does not independently recompute the full sparse preprocessing keys from canonical matrices. A new task targets that correspondence and its request bindings. Descriptive logarithms do not replace the report's exact rational inequalities.

## Reproduction

Use the exact source commits above. The two matrix packs are available from the [v2.0.3 release](https://github.com/ignotusnemo/parano1d/releases/tag/v2.0.3); verify their SHA-256 hashes in the manifest before extracting them. The command below uses the extracted pack directories and the public pins from the manifest.

```sh
# Standalone certificate repository at the pinned certificate revision.
cargo test --release --locked
cargo run --release --locked -- --exact

# Main Parano1d repository at the pinned v2.0.3 revision.
cargo test --release --locked -p noid_soundness
cargo build --release --locked -p bench_prover --bin noid_v2_soundness
target/release/noid_v2_soundness \
  history-step-pack-v1/v1/history-step.runtime ad463bd76e27df3c0f414f4fd7640cfb5c45cc7f3a09e44a2f7bc7a8b869485b \
  history-step-pack-v2/v2-runtime-metadata.bin c2a6df736b0d0da22e285b6930b11cf44b520d65b52c7dfe78f44fe0cd48e76e \
  history-step-pack-v2/retirement-keys/class-0.key 0651ce507810b61213cbdc0e9f99436aec3a7922cc662bfba6128b466453c8b2 \
  history-step-pack-v2/retirement-keys/class-1.key c301274d50dc02fd5c383f2e71629075729a954a768f5051388ec2040bce0267
```

## Open questions carried forward

The September CICO-2 expression `7^107`, or `300.386976660164` descriptive bits, remains a screening result. Characteristic-two applicability, fixed feed-forward equations and a reachable production effect are still missing; it is not entered as an attack upper frontier. The existing Poseidon2b task retains its production-impact threshold.

The new v2 tasks ask for a falsifiable sparse-retirement binding result and a concrete recursive Fiat-Shamir correspondence result. A generic paper summary, repeated baseline, helper-only malformed input or list of unsuccessful attacks does not satisfy either task. Finite Johnson-regime specialization remains a separate open mathematical question; no query count changes follow from this refresh.
