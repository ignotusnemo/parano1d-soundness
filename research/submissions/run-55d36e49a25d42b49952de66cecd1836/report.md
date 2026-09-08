# Authenticated snapshot boundary correspondence

## Claimed result

This audit supports the `current-production-correspondence` claim for the authenticated snapshot-installation path at production commit `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` and certificate commit `e45cfefd0632ed48d9f2f1975bf5174b5356a37c`.  The scoped falsifiable statement is: a network-supplied snapshot cannot materialize a terminal State unless its full HistoryStep terminal is verified against the same sealed boundary header and its independently reconstructed staged State root equals that header's `state_root`.

The certificate security game is `BadState` in `docs/category-one.md` §"The security game" (lines 43–52).  Its production-correspondence implication is stated at lines 339–357: snapshots may consume only typed authorities made after that same terminal verification and bound to an exact snapshot boundary.

## Method and source mapping

I inspected the authenticated run workspace, the pinned certificate archive and the pinned production archive.  `docs/parameter-provenance.md` §"Production acceptance correspondence" identifies the snapshot path.  I traced the concrete production entry point `apply_verified_snapshot_boundary` in `noid_node/src/main.rs:15455–15531`.

1. `SnapshotHeaderStaging::validate_complete` seals the header candidate, binds its exact height/hash/chainwork, and retains the boundary plus consensus header window (`noid_node/src/snapshot_header_staging.rs:607–685`). `ValidatedSnapshotHeaderStaging::next_record` rejects changed descriptor identity/length and an install digest mismatch (`:858–935`).
2. `verify_terminal_against_validated_snapshot_headers` passes precisely the sealed tip and epoch anchor to `MdbxChainContext::verify_snapshot_boundary` (`noid_node/src/main.rs:3894–3948`). The latter checks terminal metadata height and semantic header ID, then invokes the pinned HistoryStep verifier before minting `VerifiedSnapshotBoundary` (`noid_chain/src/storage/mdbx_context.rs:2352–2410`). The verifier's terminal relation binds expected headers, validates the proof, and checks class, accumulator and base bit (`noid_recursive/src/acceptance/history_step/relation.rs:1581–1605`).
3. `SnapshotStagingSession::finalize` reopens every accepted segment, re-verifies it, reconstructs the exact sparse State root and live count, and rejects disagreement with the boundary header (`noid_chain/src/storage/snapshot_staging.rs:503–570`).
4. `apply_staged_state_snapshot` requires staged metadata, verified boundary and sealed header source to name the identical tip, then passes them to one durable installation (`noid_chain/src/storage/mdbx_context.rs:2585–2689`). The storage installer repeats the boundary checks and commits header archive, state, terminal and consensus tip in one RW transaction (`noid_chain/src/storage/mdbx_store.rs:2319–2405`).

The static tests cover failure points relevant to this mapping: a rejected snapshot terminal leaves canonical records untouched (`mdbx_context.rs:3118–3150`), a changed staged header file cannot stream successfully (`snapshot_header_staging.rs:1533–1579`), and snapshot root/count mismatch tests occur at `snapshot_staging.rs:1492–1512`.  No executable payload or untrusted evidence instruction was run.

## Reproduction

Fetch the authenticated run workspace and immutable archives at the two commits above. Inspect the cited source ranges with `nl -ba`; confirm the terminal-to-boundary call at `main.rs:3894–3948`, state-root reconstruction at `snapshot_staging.rs:503–570`, and atomic cross-authority checks at `mdbx_context.rs:2585–2689`. The listed unit tests provide negative-path regression coverage. Compare the result with certificate `docs/category-one.md:339–357` and `docs/parameter-provenance.md` §"Production acceptance correspondence".

## Limits and conclusion

This is a bounded static correspondence audit of one acceptance path, not a proof of the cryptographic theorem, a fixed-Poseidon compiler bound, or an audit of ordinary blocks, live suffixes, reorgs, or the local producer bridge. I found no bypass by which a snapshot State root or terminal can be substituted after boundary validation. Therefore this result supports, but does not independently establish, `current-production-correspondence` for authenticated snapshot installation.
