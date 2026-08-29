# Coherent response minimum contract v0.1.0 draft

## Target claim

The target is the `coherent-response-minimum` obligation. The current certificate gives a concrete reversible schedule for one production Poseidon2b response with 17,648,280 logical gates, logical depth 11,352 and gate-depth product 200,343,274,560. That construction is an upper bound on the cost of one implementation. The production Category 1 conclusion additionally needs a justified minimum cost for any coherent implementation of the same response function.

## Exact function

The active contract must freeze the complete reversible input and output relation for the production `GF(2^128)`, width-four, rate-two, `x^7`, `RF=8`, `RP=58` Poseidon2b permutation. Ancilla initialization, garbage outputs, uncomputation, classical constants, linear layers, routing and the exact wallet, History and scalar response multiplicities must be explicit. A circuit for a different field representation, round schedule or response interface is a different track.

## Cost model

The contract must define the allowed logical gate basis, fan-out rules, connectivity assumptions, ancilla budget, measurement policy and the accounting rules for gate count and logical depth. A lower score is a stronger attack on the current premise. Scores from incompatible cost models must never share one leaderboard.

## Candidate artifact

Two artifact classes are relevant. A construction artifact supplies a reversible circuit and may demonstrate a lower concrete cost. A lower-bound artifact proves that no allowed circuit computes the exact frozen relation below a stated cost. A cheaper construction can challenge the current premise, but it cannot by itself establish a universal minimum.

## Trusted verifier

For constructions, the verifier must parse a non-executable circuit format, check every gate against the allowlist, compute exact resources and prove functional equivalence to the frozen response relation by a deterministic method appropriate to the final circuit representation. Random testing alone is insufficient. For lower bounds, the verifier must replay a formal proof or a checkable lower-bound certificate under the same cost model.

## Human review boundary

Reviewers must confirm that the frozen circuit relation and cost model match the resource theorem in [`docs/category-one.md`](../../docs/category-one.md). The machine verifier then checks circuit validity, equivalence and cost or checks the formal lower-bound artifact. Manual opinion alone cannot mark the minimum as verified.

## Effect of an accepted result

A verified cheaper construction may lower the recorded best construction and can refute a claimed minimum at or above its cost. Only a verified universal lower bound sufficient for the certificate may change `coherent-response-minimum` to `verified`. No result in this track changes the QROM composition theorem or fixed Poseidon2b delta.

## Activation blockers

- Freeze the exact reversible response relation and its digest.
- Freeze one logical cost model and non-executable circuit format.
- Implement exact resource counting and deterministic equivalence verification.
- Select the formal mechanism for universal lower-bound certificates.
- Complete independent review of the relation-to-production mapping.
