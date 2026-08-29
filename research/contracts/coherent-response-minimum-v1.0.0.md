# Coherent response circuit challenge contract v1.0.0

## Published target

The Category 1 resource corollary explicitly declares a minimum coherent response-cost premise. The executable certificate records an exact reversible schedule for one production Poseidon2b response with 17,648,280 logical gates, logical depth 11,352 and gate-depth product 200,343,274,560. Positive routing, linear and control work is omitted from that construction.

## Accepted work

A submission may provide a cheaper exact coherent construction, a universal lower bound, a correction to the reversible resource model or a counterexample to the declared premise. The result must use the exact production `GF(2^128)`, width-four, rate-two, `x^7`, `RF=8`, `RP=58` permutation and the wallet, History or scalar response interface it claims to affect.

## Required semantics

Ancilla initialization, garbage outputs, uncomputation, constants, linear layers, routing, fan-out, measurement policy, gate basis, connectivity and resource accounting must be explicit. A construction for a different field representation, round schedule or response relation is recorded as a different experiment and cannot change this premise.

The accepted `coherent-response.gate-depth` upper metric and `coherent-response.minimum-gate-depth-lower` lower metric are non-negative integer logical gate-depth values. CI rejects another unit or number format before semantic review.

## Submission and review

The PR contains `submission.json`, `report.md` and optionally one passive `artifact.json`, pins the production and certificate commits and commits to every included file digest. CI checks those passive inputs without executing contributor-controlled code. A maintainer checks production correspondence and an independent circuit reviewer checks functional equivalence and resource accounting. A later deterministic circuit verifier may supplement this process but is not used to pretend that a published human-reviewed result does not exist.

## Effect

A confirmed cheaper construction lowers the best known construction and may challenge a claimed minimum at or above its cost. Only a confirmed universal lower bound can strengthen the premise itself. Reviewed evidence that moves one side without proving or refuting the declared minimum preserves the public `premise` status. A correction updates only the affected resource terms and dependent Category 1 calculation. A rigorous source-pinned negative result may be accepted as an attributable research record with no claim effects. It does not raise or lower either frontier.
