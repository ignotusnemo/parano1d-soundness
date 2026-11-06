# Production correspondence audit contract v3.0.0

## Published target

The target is the pinned `v21-production-correspondence` claim for Parano1d revision `848209d5db75137483cb41a94b310ad11463473f`. It maps every production path capable of accepting or materializing terminal State to the objects and transitions modeled by the soundness certificate.

## Accepted work

A submission may confirm a previously unchecked source mapping, identify an exact mismatch, provide a reproducible counterexample or strengthen the source-to-model correspondence argument. It must name the affected production path and immutable source lines. General code review without a falsifiable correspondence claim is not accepted.

A rigorous inconclusive audit may be retained only when it checks one exact pinned path and establishes a specific bounded conclusion, unresolved obligation or ruled-out mismatch. A list of observations, generic review or failed search without that scoped result is not accepted work.

## Required coverage

The report must state whether it concerns ordinary block validation, an exact live suffix, reorg execution, authenticated snapshot installation, recursive ancestry or the local producer boundary. It must distinguish consensus acceptance from storage, transport and user-interface behavior.

## Submission and review

The pull request contains `submission.json`, `report.md` and optionally one passive `artifact.json`. CI checks the schema, exact source pins and file digests without executing contributor-controlled code. A Parano1d maintainer verifies the production path and an independent reviewer verifies a supporting or challenging correspondence result against the same commit. A maintainer may classify a rigorous scoped result as inconclusive with no claim effects.

## Effect

A confirmed supporting result adds evidence to the pinned correspondence claim. A confirmed acceptance-path mismatch refutes that exact claim and forces recalculation of every dependent production conclusion. A reviewed inconclusive result may enter the accepted ledger and leaderboard with an empty effects list. It preserves attribution and reproducibility but cannot change the claim, certificate or frontier.

## Current source and certificate

Production is pinned to Parano1d v2.1.0, `848209d5db75137483cb41a94b310ad11463473f`. The exact joint-ancestry certificate is pinned separately to `7ead11a3afb452fb14eea505cfa913ce20a87f9a` in the public soundness repository. Read `docs/v2.1-certificate.md` and the source paths relevant to the claimed result.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. Every result identifies its source revision and exact scope. Earlier accepted records retain their original targets.

Select one falsifiable mapping in the current source. Include activation height 210537, exact live-suffix order, bank/class authentication, contract-call binding, sparse retirement or trusted-State materialization when relevant. Storage and transport optimizations alone are outside this task unless they alter acceptance. A scoped positive result does not certify every production path.

## V2.1 source and October conditions

Production revision: `848209d5db75137483cb41a94b310ad11463473f`. Certificate implementation: `7ead11a3afb452fb14eea505cfa913ce20a87f9a`. The active machine fields in `catalog/tracks/production-correspondence-audit.json` are normative.

Audit a precise v2.1 acceptance or trusted-State materialization path against the current conditional certificate, including activation, three-class bank selection and retained ancestry.

The joint accounting retains all twenty historical events and adds six current-bank events. The exact envelope is conditional on source-linked extraction, RS-specific grouped common agreement and source restoration, coupled native/ideal child compilation, fixed-Poseidon2b deviation, honest authenticated preprocessing and declared response charges. All adversarial preprocessing and verification queries share one total charged budget.

State the exact source path, theorem hypotheses and resulting certificate effect.

See [the v2.1 derivation](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/v2.1-certificate.md) and [the full October review](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/october-2026-security-review.md).
