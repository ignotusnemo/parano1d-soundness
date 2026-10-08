# Adaptive all root v2 compiler status

The v2 compiler analysis establishes a maximum-instability lemma for an explicit partition of oracle addresses by statement, and a query-ledger identity conditional on complete representation. It also gives finite countermodels showing why correct concrete parent replay, atomic vector error and single-query instability do not by themselves supply the full adaptive compiler theorem.

The complete mathematical argument is in production `noid_soundness/docs/adaptive-all-root-v2.md`, alongside the [October source correspondences](october-2026-correspondence-results.md). The production source and integrated certificate remain pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50`; the existing correspondence argument is in `b159eb8c7c5d509ccbfc2102667769703272cd7c`. This branch does not change the active research contract, accepted ledger, official claim status or frontier arithmetic.

## Results and scope

| Obligation | Result | Remaining correspondence |
| --- | --- | --- |
| Statement-exclusive transitions | For an explicit injective partition of oracle addresses, both flip directions of the existential all-root property are bounded by the maximum local namespace instability | Map the exact compiler, including registration and expanded vector responses, to that partition or to the Fractal grammar |
| Same-database descendants | A concrete replay accepting a child does not imply that the ideal child root or its answers are in the measured database | Construct and prove the coupled recursive compiler for all required child families |
| Common budget | Count execution occurrences once, including embedded verification and output verification; a database read costs no new query | Supply the execution-to-oracle map and closure before the final measurement |
| Parallel part of the transition obligation | One-cell instability does not imply CFHL strong recognizability for a batch | Define progress/error properties and prove their local recognizers and exact finite terms |

The parallel condition refines the first and third compiler obligations. It is not a new cryptographic primitive assumption. The existing minimum scalar/batch response prices and fixed Poseidon2b deviation remain explicit conditions.

## Exact finite diagnostics

[The model checker](../research/tools/all_root_model_check.py) uses only the Python standard library, exact fractions and exhaustive finite enumeration. It checks the disjoint namespace lemma in both directions, a shared-cell maximum countermodel, a vector-to-cell instability countermodel, failure of same-database closure under a fixed-function replay, absence of one-local strong recognizers for a two-cell conjunction, and the distinction between query occurrences and distinct addresses. The production source receipts also check all twenty current event names.

From this repository root:

```sh
python3 research/tools/all_root_model_check.py \
  --production-root /path/to/parano1d \
  > /tmp/parano1d-all-root-model-check.json
```

The script authenticates the named source files against the frozen production commit before producing the receipt. The [stored reproduction receipt](../research/evidence/artifacts/2026-10-08-all-root/reproduction.json) pins the mathematical documents, checker and [exact results](../research/evidence/artifacts/2026-10-08-all-root/model-check.json). The finite checks reproduce mathematical examples; they do not execute a quantum adversary, implement a full production extractor, calculate `Delta_P2b`, or establish universal gate-depth lower bounds. The written namespace proof, rather than a finite test, establishes its statement for arbitrary finite databases.

## Certificate effect

The full adaptive all-root contract threshold is not met. The scoped correspondence results stand, and the conditional dominant-term floor `173.3897612554174` and ideal Category 1 envelope approximately `0.04937388373372754` remain unchanged. No supporting all-root submission or green all-root claim should be created from these diagnostics.

The next mathematical step is an explicit coupled compiler and its progress property. Publishing another reproduction of the same calculator, or enlarging a native/trace regression suite, would not close that obligation.
