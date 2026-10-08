# Production correspondence audit contract v2.0.0

## Published target

The target is the pinned `v2-production-correspondence` claim for Parano1d revision `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. It maps every production path capable of accepting or materializing terminal State to the objects and transitions modeled by the soundness certificate.

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

Production code and the integrated certificate are both pinned to Parano1d v2.0.3, commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in [the production repository](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50). Obtain the complete production checkout in addition to this research workspace. Read `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the exact production entry points relevant to the result. The separate standalone calculator in the research repository describes a historical profile and is not the current v2 certificate.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. A v2 claim must be established against the current production source; an earlier audit is context, not an automatic v2 conclusion.

Select one falsifiable mapping in the current source. Include activation height 210537, exact live-suffix order, bank/class authentication, contract-call binding, sparse retirement or trusted-State materialization when relevant. Storage and transport optimizations alone are outside this task unless they alter acceptance. A scoped positive result does not certify every production path.
