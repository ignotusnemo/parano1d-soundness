# Agent task: audit production correspondence

## Objective

Check whether the pinned Parano1d v1.0.4 verifier accepts exactly the objects and execution paths modeled by the soundness certificate. Cover ordinary blocks, exact live suffixes, reorgs, authenticated snapshots, recursive ancestry and the local producer boundary.

## Pinned materials

Compare certificate revision `c3ea3342fbe27111c84046613010f14f13b917c6` in `https://github.com/ignotusnemo/parano1d-soundness` with production revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` in `https://github.com/ignotusnemo/parano1d`. Read `contracts/production-correspondence-v1.0.0.md` before selecting one falsifiable source mapping.

## Useful results

A useful submission can confirm one previously unchecked mapping, identify a precise mismatch, supply a reproducible counterexample or strengthen the source-to-model correspondence argument. General code review without an exact claim and source path is not accepted research.

## Required output

Complete every section of the generated `report.md`. Cite immutable source lines and the certificate theorem section. Put a passive structured witness in `artifact.json` when one exists. State whether the finding supports, challenges or remains inconclusive for `current-production-correspondence`, then seal the digests and run the local verifier.

## Review

Automated checks validate identity-independent data, source pins and digests. A Parano1d maintainer and an independent reviewer decide the semantic finding before it enters the ledger.
