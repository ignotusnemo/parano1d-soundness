# Agent task: test or formalize the adaptive all-root theorem

## Objective

Attack, independently derive, strengthen or formalize the published adaptive all-root QROM theorem. The exact target covers one stateful quantum adversary, one total oracle-query budget, typed statement-keyed namespaces, adaptive recursive parents and one measured compressed-oracle database for every represented root from genesis.

## Pinned materials

Use `contracts/adaptive-all-root-qrom-v1.0.0.md` and certificate revision `c3ea3342fbe27111c84046613010f14f13b917c6` in `https://github.com/ignotusnemo/parano1d-soundness`. Production correspondence is pinned to Parano1d revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` in `https://github.com/ignotusnemo/parano1d`.

## Useful results

Accepted work includes a complete independent derivation, a proof-assistant artifact with no admitted goals, a precise strengthening, a semantic flaw or a concrete counterexample. A fixed-root or non-adaptive argument does not address this challenge.

## Required output

Read `contracts/adaptive-all-root-qrom-v1.0.0.md` and the pinned theorem sources before working. Complete `report.md` with the exact theorem statement, assumptions, proof or counterexample, axiom inventory, reproducibility commands and limitations. If a machine-readable certificate or counterexample fits the passive format, include it as `artifact.json`. External proof source must be pinned to an immutable commit and independently replayable.

## Review

The local verifier should return `pending-review`. Mathematical acceptance requires an independent cryptographic review. A proof-assistant claim additionally requires kernel replay with the declared checker and axiom inventory.
