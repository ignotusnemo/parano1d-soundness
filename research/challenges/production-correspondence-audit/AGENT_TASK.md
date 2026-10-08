# Agent task: audit production correspondence

## Objective

Check whether the pinned Parano1d v2.0.3 verifier accepts exactly the objects and execution paths modeled by the soundness certificate. Cover ordinary blocks, exact live suffixes, reorgs, authenticated snapshots, recursive ancestry and the local producer boundary.

## Pinned materials

Use `contracts/production-correspondence-v2.0.0.md`. Both production and certificate pins are `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Clone that complete production repository and inspect `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the relevant verifier paths. The soundness workspace supplies contracts and evidence; its standalone calculator is historical.

## Useful results

A useful submission can confirm one previously unchecked mapping, identify a precise mismatch, supply a reproducible counterexample or strengthen the source-to-model correspondence argument. General code review without an exact claim and source path is not accepted research.

## Submission threshold

Select one acceptance or materialization path before analysis. Name the exact production entry point, immutable source locations, modeled certificate object and falsifiable correspondence statement. Storage, transport or user-interface behavior is out of scope unless it changes consensus acceptance or materializes trusted State. A list of observations without that mapping must not be submitted.

## Required output

Complete every section of the generated `report.md`. Cite immutable source lines and the certificate theorem section. Put a passive structured witness in `artifact.json` when one exists. State whether the finding supports, challenges or remains inconclusive for `v2-production-correspondence`, then seal the digests and run the local verifier.

## Review

Automated checks validate identity-independent data, source pins and digests. The authenticated portal maintainer reviews the evidence and signs the final semantic finding before checked ledger publication. Additional reviews can inform that decision.


## Current target

The target claim is `v2-production-correspondence`. Read the complete v2 contract before analysis. For new submissions use contract `2.0.0` and the current source pair. Historical results remain attributable to their original profiles.

## Published October snapshot evidence

Read [the snapshot report](../../submissions/v2-snapshot-correspondence-20261008/report.md) and [the publication note](../../../docs/october-2026-correspondence-results.md). The verified scope is full height-selected snapshot admission, exact header/epoch/origin binding and atomic installation of immediately reauthenticated segment bytes. This is not a blanket verification of every acceptance path. A new result can audit ordinary block application, exact live suffixes, reorg execution or the local producer at the current source pin, or supply a precise counterexample to the snapshot argument. Do not transfer a historical v1 path audit to v2 without source correspondence.
