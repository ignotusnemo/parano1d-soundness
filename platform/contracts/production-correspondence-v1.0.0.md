# Production correspondence audit contract v1.0.0

## Published target

The target is the pinned `current-production-correspondence` claim for Parano1d v1.0.4 revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0`. It maps every production path capable of accepting or materializing terminal State to the objects and transitions modeled by the soundness certificate.

## Accepted work

A submission may confirm a previously unchecked source mapping, identify an exact mismatch, provide a reproducible counterexample or strengthen the source-to-model correspondence argument. It must name the affected production path and immutable source lines. General code review without a falsifiable correspondence claim is not accepted.

## Required coverage

The report must state whether it concerns ordinary block validation, an exact live suffix, reorg execution, authenticated snapshot installation, recursive ancestry or the local producer boundary. It must distinguish consensus acceptance from storage, transport and user-interface behavior.

## Submission and review

The pull request contains `submission.json`, `report.md` and optionally one passive `artifact.json`. CI checks the schema, exact source pins and file digests without executing contributor-controlled code. A Parano1d maintainer verifies the production path and an independent reviewer verifies the claimed correspondence result against the same commit.

## Effect

A confirmed supporting result adds evidence to the pinned correspondence claim. A confirmed acceptance-path mismatch refutes that exact claim and forces recalculation of every dependent production conclusion. An inconclusive review is retained in the pull request history but does not enter the accepted ledger or leaderboard.
