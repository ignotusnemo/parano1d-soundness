# Coherent response circuit challenge contract v2.0.0

## Published target

The complete compositional scalar response construction has at most 100,233,080 gates, depth 20,037 and gate-depth product 2,008,370,223,960 in the exact fixed-register unitary model. It includes field reduction, linear layers, constants, conversion, fanout, copy and uncomputation. Delta's accepted target-touch argument proves a scalar lower bound of gates ≥ 128 and depth ≥ 1 in that same restricted model. Neither bound establishes the separately declared larger scalar and batch resource prices used by the Category 1 corollary. See `noid_soundness/docs/response-accounting.md` and the event prices in `noid_soundness/src/v2.rs` at the pinned production commit.

## Accepted work

A submission may provide a cheaper exact coherent construction, a universal lower bound, a correction to the reversible resource model or a counterexample to the declared premise. The result must use the exact production `GF(2^128)`, width-four, rate-two, `x^7`, `RF=8`, `RP=58` permutation and the wallet, History, sparse-retirement or scalar response interface it claims to affect.

## Required semantics

Ancilla initialization, garbage outputs, uncomputation, constants, linear layers, routing, fan-out, measurement policy, gate basis, connectivity and resource accounting must be explicit. A construction for a different field representation, round schedule or response relation is recorded as a different experiment and cannot change this premise.

The accepted `coherent-response.gate-depth` upper metric and `coherent-response.minimum-gate-depth-lower` lower metric are non-negative integer logical gate-depth values. CI rejects another unit or number format before semantic review.

## Submission and review

The PR contains `submission.json`, `report.md` and optionally one passive `artifact.json`, pins the production and certificate commits and commits to every included file digest. CI checks those passive inputs without executing contributor-controlled code. A maintainer checks production correspondence and an independent circuit reviewer checks functional equivalence and resource accounting. A later deterministic circuit verifier may supplement this process but is not used to pretend that a published human-reviewed result does not exist.

## Effect

A confirmed cheaper construction lowers the best known construction and may challenge a claimed minimum at or above its cost. Only a confirmed universal lower bound can strengthen the premise itself. Reviewed evidence that moves one side without proving or refuting the declared minimum preserves the public `premise` status. A correction updates only the affected resource terms and dependent Category 1 calculation. A rigorous source-pinned negative result may be accepted as an attributable research record with no claim effects. It does not raise or lower either frontier.

## Current source and certificate

Production code and the integrated certificate are both pinned to Parano1d v2.0.3, commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in [the production repository](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50). Obtain the complete production checkout in addition to this research workspace. Read `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the exact production entry points relevant to the result. The separate standalone calculator in the research repository describes a historical profile and is not the current v2 certificate.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. A v2 claim must be established against the current production source; an earlier audit is context, not an automatic v2 conclusion.
