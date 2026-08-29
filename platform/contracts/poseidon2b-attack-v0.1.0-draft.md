# Fixed Poseidon2b attack contract v0.1.0 draft

## Target claim

The target is the `fixed-poseidon2b-delta` obligation. `Delta_P2b` is defined by the fixed compiler experiment in [`docs/category-one.md`](../../docs/category-one.md), not by a secret-key PRP game. It bounds the excess probability of `BadCompiler` for the public production Poseidon2b duplex over the complete typed ideal-game bound.

## Exact production instance

Every artifact is bound to `GF(2^128)`, state width four, rate two, capacity two, exponent seven, eight full rounds, 58 partial rounds, the snapshotted external and internal matrices, production round constants, `FsLaneChallenger` framing, typed domains, two-to-one feed-forward Merkle compression and the pinned native and recursive verifier semantics. Results for sponge, compression, CICO, collision, preimage, differential, algebraic and fixed-compiler games remain separately labeled.

## Candidate artifact classes

A concrete witness may provide explicit inputs, outputs, transcript material or an algebraic trail that the verifier can check exactly. A construction may provide a non-executable description in a frozen instruction language. A probability or work-factor claim requires a checkable derivation certificate. Arbitrary submitted programs, binaries, build scripts and package dependencies are not accepted by the trusted verifier.

## Trusted verifier

The verifier must implement the production field, constants, permutation, duplex framing and domain separation independently from contributor data. It must recompute every witness and reject any parameter mismatch. Ranked metrics must state their game, resource model, direction and exact arithmetic. A classical trail cannot be promoted as a QROM fixed-compiler delta, and a direct distinguisher between a public fixed permutation and a secret random permutation is outside this contract.

## Asymmetric acceptance

A concrete counterexample can lower or refute a claim once the frozen verifier reproduces it. Raising the security assessment requires a proof or bound covering the complete fixed-compiler event, not an unsuccessful search and not the absence of a better leaderboard entry. This asymmetry is intentional.

## Human review boundary

Cryptographic review freezes the game and determines whether a proposed metric says anything about `Delta_P2b`. Production review freezes the exact framing and verifier correspondence. After that boundary is approved, concrete witnesses and scores are checked deterministically in CI.

## Effect of an accepted result

An accepted artifact may change only `fixed-poseidon2b-delta` and metrics explicitly defined by this contract. Classical results that do not cover the fixed compiler event are recorded as scoped cryptanalysis and cannot remove the production condition.

## Activation blockers

- Import and independently test the exact production field, constants, permutation and framing.
- Freeze separate schemas and metrics for each accepted attack class.
- Implement exact witness replay and derivation-certificate checks.
- Add cross-implementation vectors against the pinned Parano1d revision.
- Obtain cryptographic and production-correspondence approval of the fixed game.
