# All-root theorem review and formalization contract v2.0.0

## Published target

The target is the published `v2-all-root-composition` condition in the current integrated certificate. It covers one stateful quantum adversary, one total oracle-query budget and every adaptively selected typed wallet, History and sparse-retirement root represented in a single measured compressed-oracle database. The review must establish whether the existing all-root lifting covers the complete v2 inventory and retained pre-activation ancestry without an unjustified multiplier or dropped event.

## Accepted work

A submission may provide an independent derivation, a proof-assistant formalization, a precise strengthening, a semantic correspondence audit or a concrete counterexample. It must address the exact typed statement-keyed namespaces, `BadAll`, `MissRep`, `BadTypedBind`, adaptive recursive parents, deterministic post-measurement traversal and the terminal invalid-State game. A fixed-root or non-adaptive theorem is a different result.

## Submission

The PR contains `submission.json`, `report.md` and optionally one passive `artifact.json`. The manifest pins the production commit, certificate commit, target claim and file digests. The report must state the claimed effect, full assumptions, theorem or counterexample, primary sources and a reproducible artifact commit when one exists.

## Verification

CI validates the schema, source pins and report digest without executing contributor-controlled code. A maintainer checks production correspondence and an independent cryptographic reviewer checks the mathematical argument. A proof-assistant artifact additionally requires a pinned checker, complete axiom inventory, no admitted goals and independent kernel replay before it can be recorded as machine checked.

## Effect

Supporting evidence adds a versioned record without silently changing the theorem statement. A confirmed strengthening may replace the theorem only through an explicit contract revision. A confirmed counterexample marks the exact claim as challenged or refuted and recalculates dependent conclusions. Failed attack searches do not raise a bound.

## Current source and certificate

Production code and the integrated certificate are both pinned to Parano1d v2.0.3, commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in [the production repository](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50). Obtain the complete production checkout in addition to this research workspace. Read `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the exact production entry points relevant to the result. The separate standalone calculator in the research repository describes a historical profile and is not the current v2 certificate.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. A v2 claim must be established against the current production source; an earlier audit is context, not an automatic v2 conclusion.

Include all 20 current typed events, authenticated legacy retirement matrices and keys, adaptive parent selection, request context and from-genesis ancestry. An argument for only a fixed root, a single block or the historical event inventory does not settle this condition.
