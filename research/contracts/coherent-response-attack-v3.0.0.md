# Coherent response circuit challenge contract v3.0.0

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

Production is pinned to Parano1d v2.1.0, `848209d5db75137483cb41a94b310ad11463473f`. The exact joint-ancestry certificate is pinned separately to `7ead11a3afb452fb14eea505cfa913ce20a87f9a` in the public soundness repository. Read `docs/v2.1-certificate.md` and the source paths relevant to the claimed result.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. Every result identifies its source revision and exact scope. Earlier accepted records retain their original targets.

## V2.1 source and October conditions

Production revision: `848209d5db75137483cb41a94b310ad11463473f`. Certificate implementation: `7ead11a3afb452fb14eea505cfa913ce20a87f9a`. The active machine fields in `catalog/tracks/coherent-response-attack.json` are normative.

Prove a coherent response lower charge or construct an exact cheaper reversible circuit for the v2.1 response relation under the frozen logical resource model.

The joint accounting retains all twenty historical events and adds six current-bank events. The exact envelope is conditional on source-linked extraction, RS-specific grouped common agreement and source restoration, coupled native/ideal child compilation, fixed-Poseidon2b deviation, honest authenticated preprocessing and declared response charges. All adversarial preprocessing and verification queries share one total charged budget.

State the exact source path, theorem hypotheses and resulting certificate effect.

See [the v2.1 derivation](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/v2.1-certificate.md) and [the full October review](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/october-2026-security-review.md).
