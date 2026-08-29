# Production Poseidon2b cryptanalysis contract v1.0.0

## Published target

The target is the exact public production Poseidon2b instance: `GF(2^128)`, state width 4, rate 2, capacity 2, `x^7`, 8 full rounds, 58 partial rounds, pinned external and internal matrices, production constants, `FsLaneChallenger` framing, typed domains and the two-to-one feed-forward compression used by Merkle trees.

## Accepted work

A submission may provide a concrete collision, preimage, second-preimage or CICO attack, a compression or sponge attack, a fixed-compiler QROM bound, an indifferentiability result or a counterexample to the sufficient production condition. Each submission must name one exact game. Every accepted work factor uses that game's dedicated metric identifier. Work factors from different games are never merged into one score.

## Required evidence

Concrete witnesses must be independently recomputable against the frozen production implementation. Analytical bounds must state every model assumption, derive the production specialization and identify the primary source or reproducible artifact commit. Widths, matrices, round schedules or modes that differ from production are recorded separately and cannot change the production claim.

Accepted exact metrics use `poseidon2b.permutation-collision-work-bits`, `poseidon2b.permutation-preimage-work-bits`, `poseidon2b.permutation-second-preimage-work-bits`, `poseidon2b.permutation-cico-work-bits`, `poseidon2b.sponge-collision-work-bits`, `poseidon2b.compression-collision-work-bits`, `poseidon2b.delta-upper` or `poseidon2b.delta-lower`. Work metrics are exact non-negative decimal bit values. Delta metrics are exact decimal probabilities in `[0, 1]`. This separation prevents the verifier from comparing or scoring unlike security games as one quantity.

## Submission and review

The PR contains `submission.json`, `report.md` and optionally one passive `artifact.json`, pins the production and certificate commits and commits to every included file digest. CI checks those passive inputs without executing contributor-controlled code. A maintainer verifies production correspondence and two cryptographic reviewers confirm the attack or bound before it enters the accepted ledger.

## Effect

A confirmed attack records its exact game and measured work and updates only the claims it actually reaches. Evidence that neither proves nor refutes the fixed `Delta_P2b` condition preserves its public `premise` status while adding the reviewed metric. A fixed-compiler QROM result may prove or refute that condition. Classical cryptanalysis remains valuable evidence but is never presented as the end-to-end post-quantum result. Failed searches do not raise a bound.
