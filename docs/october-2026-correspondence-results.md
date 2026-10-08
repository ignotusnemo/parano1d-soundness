# October 2026 scoped v2 correspondence results

This project evidence update records the source proofs and reproductions published by ignotusnemo with Codex assistance for Parano1d v2.0.3. The production and integrated certificate remain pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. The [integrated argument](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/b159eb8c7c5d509ccbfc2102667769703272cd7c/noid_soundness/docs/v2-correspondence-2026-10.md) contains the deterministic lemmas, conditional ancestry argument and unresolved adaptive compiler obligations. No consensus behavior or numerical soundness bound changes.

## Established source obligations

| Source obligation | Established scope | Retained conditions |
| --- | --- | --- |
| Release preprocessing and sparse retirement | Independent reconstruction of both complete release keys; request, point/value, live-class and eleven-column binding | Shared canonical decoder and PCS implementation; declared commitment, algebraic and extraction conditions |
| Selected parent and transcript | Legal framing, native/trace arithmetic, selected-arm enforcement, inactive-lane carry and authenticated fixed relation | Exact arithmetic and authenticated sidecar/local extraction; general concrete Fiat-Shamir and adaptive database embedding are not established |
| Authenticated snapshot installation | Full terminal/header/epoch/origin binding and reauthentication of the bytes atomically installed in MDBX | Terminal soundness, root binding, native fork choice and fixed callback; other acceptance paths are outside this result |

The [retirement report](../research/submissions/v2-retirement-correspondence-20261008/report.md), [parent/transcript report](../research/submissions/v2-selected-parent-transcript-20261008/report.md) and [snapshot report](../research/submissions/v2-snapshot-correspondence-20261008/report.md) state falsifiable claims, exact sources, assumptions and limitations. The 54 Rust tests passed with zero failures: 35 snapshot tests, 12 bank/origin/cache tests, one small independent preprocessing test, two full release-key reconstructions and four native/trace correspondence tests. The full reconstruction covers 152,532,541 canonical entries and matches fourteen static roots and every byte of both 304-byte keys. Mutations corroborate the source arguments; they are not cryptographic probability bounds. The proofs do not rely solely on these tests.

## Reproduction materials

The [receipt manifest](../research/evidence/artifacts/2026-10-08-correspondence/reproduction.json) lists every passive report, artifact and test-log digest. Download the [23-file input archive](https://noid.network/research-artifacts/v2-correspondence-20261008/reproduction-inputs.tar.zst), verify SHA-256 `25a0f1df8b90b71ff659b76a8e17b3d39f86e1d5bbd784aa4f8db919a7a9cbfa`, and use the exact harness commands in the reports. The archive contains the authenticated release matrices/keys and genuinely accepted isolated-network origin and terminal fixtures. An isolated successor bank and activation height are always labeled as such; they are not a mainnet origin. Release-key reconstruction uses independent table construction but the shared production canonical decoder and PCS commitment implementation.

## Publication and open work

These are maintainer-authorized official project records, separate from the submission acceptance ledger. They do not claim an independent reviewer, signed third-party approval or proof-assistant kernel replay. The three passive submissions retain their original bytes and remain pending review under their frozen contracts. No self-approval or submission leaderboard credit is introduced by this update. The map uses `verified` for the named source correspondences, not `proved` for an unconditional post-quantum theorem.

The conditional deterministic worklist lemma establishes descent to genesis while preserving every live ancestry obligation. Complete adaptive all-root closure still requires statement-exclusive measured-database transitions, representation of all required extracted children in the same measured database, and a common oracle budget that includes embedded-verifier queries. Fixed Poseidon2b instantiation/deviation and universal scalar/amortized batch response minimum prices remain conditions. A constructive response upper bound does not establish those minimum prices.

The mainnet v2 dominant-term gate-depth floor remains `173.3897612554174` descriptive bits, and the ideal Category 1 envelope remains approximately `0.04937388373372754` with the same 20-event inventory. Historical records and signed review decisions are unchanged. New research should address the named remaining obligations or a new production path rather than resubmit these source mappings.
