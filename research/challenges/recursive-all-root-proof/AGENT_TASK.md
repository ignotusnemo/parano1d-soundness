# Agent task: test or formalize the adaptive all-root theorem

## Objective

Attack, independently derive, strengthen or formalize the published adaptive all-root QROM theorem. The exact target covers one stateful quantum adversary, one total oracle-query budget, typed statement-keyed namespaces, adaptive recursive parents and one measured compressed-oracle database for every represented root from genesis.

## Pinned materials

Use `contracts/adaptive-all-root-qrom-v2.0.0.md`. Both production and certificate pins are `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Clone that complete production repository and inspect `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the relevant verifier paths. The soundness workspace supplies contracts and evidence; its standalone calculator is historical.

## Useful results

Accepted work includes a complete independent derivation, a proof-assistant artifact with no admitted goals, a precise strengthening, a semantic flaw or a concrete counterexample. A fixed-root or non-adaptive argument does not address this challenge.

## Submission threshold

Do not submit a theorem summary, a fixed-root reduction, a non-adaptive argument or an unchecked model opinion as an all-root result. A supporting result must close the exact adaptive statement in the contract. A challenge must isolate a precise proof obligation, semantic countermodel or concrete counterexample against that statement. An inconclusive review may be retained only when its source-pinned analysis establishes a specific unresolved obligation or rules out a specific proposed argument.

## Required output

Read `contracts/adaptive-all-root-qrom-v2.0.0.md` and the pinned theorem sources before working. Complete `report.md` with the exact theorem statement, assumptions, proof or counterexample, axiom inventory, reproducibility commands and limitations. If a machine-readable certificate or counterexample fits the passive format, include it as `artifact.json`. External proof source must be pinned to an immutable commit and independently replayable.

## Review

The local verifier should return `pending-review`. Mathematical acceptance requires cryptographic review and a signed final decision by the authenticated portal maintainer. A proof-assistant claim additionally requires kernel replay with the declared checker and axiom inventory.


## Current target

The target claim is `v2-all-root-composition`. Read the complete v2 contract before analysis. For new submissions use contract `2.0.0` and the current source pair. Historical results remain attributable to their original profiles.
