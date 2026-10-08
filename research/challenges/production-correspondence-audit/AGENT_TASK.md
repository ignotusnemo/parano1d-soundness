# Agent task: audit production correspondence

## Objective

Check whether the pinned Parano1d v1.0.4 verifier accepts exactly the objects and execution paths modeled by the soundness certificate. Cover ordinary blocks, exact live suffixes, reorgs, authenticated snapshots, recursive ancestry and the local producer boundary.

## Pinned materials

Compare certificate revision `5e6951555dd67d37ede40b6e272561cd7022089d` in `https://git.parano1d.org/ignotusnemo/parano1d-soundness` with production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` in `https://git.parano1d.org/ignotusnemo/parano1d`. Read `contracts/production-correspondence-v1.3.0.md` before selecting one falsifiable source mapping.

## Useful results

A useful submission can confirm one previously unchecked mapping, identify a precise mismatch, supply a reproducible counterexample or strengthen the source-to-model correspondence argument. General code review without an exact claim and source path is not accepted research.

## Submission threshold

Select one acceptance or materialization path before analysis. Name the exact production entry point, immutable source locations, modeled certificate object and falsifiable correspondence statement. Storage, transport or user-interface behavior is out of scope unless it changes consensus acceptance or materializes trusted State. A list of observations without that mapping must not be submitted.

## Required output

Complete every section of the generated `report.md`. Cite immutable source lines and the certificate theorem section. Put a passive structured witness in `artifact.json` when one exists. State whether the finding supports, challenges or remains inconclusive for `current-production-correspondence`, then seal the digests and run the local verifier.

## Review

Automated checks validate identity-independent data, source pins and digests. The authenticated portal maintainer reviews the evidence and signs the final semantic finding before checked ledger publication. Additional reviews can inform that decision.

## Profile boundary

This is the historical v1 profile. Do not transfer its numerical result or a scoped acceptance audit to v2. The current v2 bank has separate tasks and evidence.
