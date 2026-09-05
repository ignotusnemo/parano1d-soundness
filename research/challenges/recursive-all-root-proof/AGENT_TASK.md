# Agent task: test or formalize the adaptive all-root theorem

## Objective

Attack, independently derive, strengthen or formalize the published adaptive all-root QROM theorem. The exact target covers one stateful quantum adversary, one total oracle-query budget, typed statement-keyed namespaces, adaptive recursive parents and one measured compressed-oracle database for every represented root from genesis.

## Pinned materials

Use `contracts/adaptive-all-root-qrom-v1.1.0.md` and certificate revision `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` in `https://github.com/ignotusnemo/parano1d-soundness`. Production correspondence is pinned to Parano1d revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` in `https://github.com/ignotusnemo/parano1d`.

## Useful results

Accepted work includes a complete independent derivation, a proof-assistant artifact with no admitted goals, a precise strengthening, a semantic flaw or a concrete counterexample. A fixed-root or non-adaptive argument does not address this challenge.

## Submission threshold

Do not submit a theorem summary, a fixed-root reduction, a non-adaptive argument or an unchecked model opinion as an all-root result. A supporting result must close the exact adaptive statement in the contract. A challenge must isolate a precise proof obligation, semantic countermodel or concrete counterexample against that statement. An inconclusive review may be retained only when its source-pinned analysis establishes a specific unresolved obligation or rules out a specific proposed argument.

## Required output

Read `contracts/adaptive-all-root-qrom-v1.1.0.md` and the pinned theorem sources before working. Complete `report.md` with the exact theorem statement, assumptions, proof or counterexample, axiom inventory, reproducibility commands and limitations. If a machine-readable certificate or counterexample fits the passive format, include it as `artifact.json`. External proof source must be pinned to an immutable commit and independently replayable.

## Review

The local verifier should return `pending-review`. Mathematical acceptance requires an independent cryptographic review. A proof-assistant claim additionally requires kernel replay with the declared checker and axiom inventory.
