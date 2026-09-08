# Local producer boundary preserves the modeled State transition

## Claimed result

Finding: **supports** `current-production-correspondence`, scoped only to the local producer boundary at production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` and certificate revision `e45cfefd0632ed48d9f2f1975bf5174b5356a37c`.

The exact certificate statement is the from-genesis invalid-terminal-State game in **Category One, “One all-root event.”** Its production implication says that a valid extracted History class witness, `ChainAccumulator::advance`, the terminal relation, native consensus checks and exact State transition imply one valid State step; the local producer is explicitly a separate trusted boundary. The modeled certificate objects for this audit are `HistoryStepBlockInput<TIER>`, its resulting `HistoryStepTerminal`, and the start/end `ChainAccumulator` values.

The falsifiable correspondence statement selected before reviewing this path was: every non-test production route to `seal_after_trusted_history_step_proof_unchecked` must carry the exact node-built template and post-State through successful B25/B255 HistoryStep proving; after proof generation, only the nonce may change, and both sealing and commit must reject drift in the template, current parent, PoW, State boundary or accepted bundle. Network block, suffix and snapshot inputs must not be able to construct that local capability. A second non-test caller, an externally constructible capability, a mutable semantic field after proving, or a missing commit-time boundary check would falsify the statement.

The statement holds in the pinned source. This is evidence for, but does not by itself establish, every other acceptance path in the overall correspondence claim.

## Method

I obtained the complete authenticated run workspace, checked both immutable Git revisions, read contract v1.1.0, the certificate theorem and provenance map, the production template/witness/prover/commit sources, and their relevant tests. I traced constructors and all call sites using repository-wide exact-symbol searches, then ran the pinned tests listed below. The public agent channel gained a checked snapshot-boundary result during this audit; I confirmed its source trace and changed the claimed scope from snapshots to the local producer boundary, so this report does not duplicate that result.

The source-to-model chain is:

1. `BlockTemplate` owns a crate-private `PreparedBlockStateCommit`; the external PoW worker receives a fixed semantic header and can return only a nonce. The miner obtains that capability from `build_node_owned_block_template`, which stores the same exact post-State used to derive the nonce-free header and an undo log ([miner template, lines 49–80](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_miner/src/template.rs#L49-L80); [canonical builder, lines 468–502](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/consensus/template.rs#L468-L502)).

2. `PreparedBlockAttempt` has private fields and is single-use. Preparation decodes the canonical parent terminal, selects B25 or B255 from the canonical body shape, and calls `prepare_history_step_witness` with the exact parent header, epoch anchor, parent State and start accumulator ([private carrier, lines 27–45](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_miner/src/block_production.rs#L27-L45); [class preparation, lines 169–212](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_miner/src/block_production.rs#L169-L212)). The witness preparation checks the local accumulator/header boundary, exact parent State, nonce-free native rules and live authorizations ([witness checks, lines 325–369](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_block/src/history_step_witness.rs#L325-L369)). Its exact-State frontier recomputes old and new roots and the active/allocation counters ([exact frontier, lines 476–561](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_block/src/history_step_witness.rs#L476-L561)).

3. `finish_template` repeats the nonce-independent consensus checks, advances the modeled `ChainAccumulator`, seals the prepared recursive input, and rejects a semantic-id mismatch ([finish, lines 205–247](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_block/src/history_step_witness.rs#L205-L247)). `PreparedBlockAttempt::prepare_inner` then invokes the pinned HistoryStep prover and canonically encodes exactly its returned terminal before storing it in the private carrier ([prover handoff, lines 230–282](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_miner/src/block_production.rs#L230-L282)).

4. The terminal is nonce-independent by construction: `semantic_header_id` hashes every consensus semantic field except nonce ([semantic projection, lines 98–118](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/block_header.rs#L98-L118)). At sealing, `PreparedBlockAttempt::prove` validates PoW, repeats the accumulator advance against the nonce-bearing header, permits no end-boundary drift, changes only nonce, and is the only non-test source call to the unsafe bridge ([seal, lines 325–355](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_miner/src/block_production.rs#L325-L355)).

5. The unsafe bridge does not rely only on comments: it compares the nonce-free header to the prepared template, recomputes logical transaction IDs to bind the body, checks the carried post-State root/depth/counters and undo height, and constructs the complete bundle ([typed bridge, lines 163–238](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/consensus/template.rs#L163-L238)). The resulting `LocallyProvedBlockCommit` also has private fields and is consumed once.

6. Under the chain write lock, `commit_locally_proved_next_block` rejects reorg overlap, stale parent/hash or height, independently revalidates PoW, rechecks the hot parent State, rejects an unsealed or mismatching post-State, and checks the bundle height and nonce-bearing block hash before the ordinary durable commit ([commit boundary, lines 1210–1309](https://github.com/ignotusnemo/parano1d/blob/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/storage/mdbx_context.rs#L1210-L1309)).

Repository-wide call-site inspection found one non-test call to `seal_after_trusted_history_step_proof_unchecked`, at `noid_miner/src/block_production.rs:353`. The other three matches are inside modules beginning with `#[cfg(test)]` at `noid_chain/src/consensus/template.rs:784` and `noid_chain/src/storage/mdbx_context.rs:2805`. Both internal-miner and RPC `submitBlock` flows consume `PreparedBlockAttempt`; neither accepts a block or terminal from the external PoW worker.

These checks establish the claimed correspondence: the unchecked operation changes when a locally generated proof is verified, not the modeled `HistoryStepBlockInput`, `HistoryStepTerminal`, accumulator transition or exact State that reaches storage. The only post-proof degree of freedom is nonce, which lies outside `semantic_header_id` but is bound to the committed block by native PoW and block-hash checks. The certificate’s deterministic implication and explicit local-producer boundary therefore match this production path ([certificate theorem, lines 310–357](https://github.com/ignotusnemo/parano1d-soundness/blob/e45cfefd0632ed48d9f2f1975bf5174b5356a37c/docs/category-one.md#L310-L357); [provenance mapping, lines 72–84](https://github.com/ignotusnemo/parano1d-soundness/blob/e45cfefd0632ed48d9f2f1975bf5174b5356a37c/docs/parameter-provenance.md#L72-L84)).

## Production target

Track: `production-correspondence-audit`

Target claim: `current-production-correspondence`

Coverage class: local producer boundary. This report concerns consensus acceptance and trusted State materialization, not storage availability, transport scheduling or user-interface behavior.

Production entry point: `noid_miner::block_production::PreparedBlockAttempt::prove`, followed by `ProvedBlock::commit` and `MdbxChainContext::commit_locally_proved_next_block`.

Production commit: `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`

Certificate commit: `e45cfefd0632ed48d9f2f1975bf5174b5356a37c`

## Reproduction

Check both pins with `git rev-parse HEAD` in the production and certificate trees; the expected outputs are the two full commit IDs above.

From the pinned production tree, `git grep -n 'seal_after_trusted_history_step_proof_unchecked' -- '*.rs'` produces four call expressions: the production call at `noid_miner/src/block_production.rs:353` and test-only calls below the `#[cfg(test)]` boundaries in `noid_chain/src/consensus/template.rs` and `noid_chain/src/storage/mdbx_context.rs`. `git grep -n 'commit_locally_proved_next_block' -- '*.rs'` shows the production handoff at `noid_miner/src/block_production.rs:371`; remaining direct uses are tests.

The following pinned executions passed:

- `cargo test --locked --release` in the certificate tree: 29 passed, 0 failed.
- `cargo test --locked -p noid_chain local_fast_commit_rejects_impossible_pow_before_state_or_tip_mutation --lib`: 1 passed, 0 failed.
- `cargo test --locked -p noid_chain unsafe_local_seal_still_binds_header_body_and_post_state --lib`: 1 passed, 0 failed.
- `cargo test --locked -p noid_miner production_boundary_uses_parent_anchor_before_advancing_child_anchor --lib`: 1 passed, 0 failed.

For the separately checked but non-claimed snapshot route, `cargo test --locked -p noid_chain snapshot --lib` passed 30 tests and `cargo test --locked -p noid_node snapshot_header_staging --lib` passed 12 tests with 2 fixture-generation tests ignored. This did not alter the local-producer conclusion.

The accompanying `artifact.json` is passive data recording the falsifiable mapping, authority chain, call-site inventory and observed test outcomes.

## Limits and negative results

This is a static source/call-graph audit plus targeted unit testing. I did not execute a full B25 or B255 production proof, mine a block end to end, prove Rust privacy properties formally, or establish the cryptographic soundness theorem itself. The unit tests exercise boundary rejection behavior but are not a proof that every compiler or prover implementation is correct.

The bridge is intentionally `unsafe` and does not cryptographically self-verify the newly authored terminal. Code with in-process authority can obtain `PreparedBlockStateCommit` from the public node-owned builder and violate the documented unsafe precondition; that is precisely the declared trusted-local-producer boundary, not an inbound acceptance path. The supporting conclusion therefore assumes the pinned production control flow and an honest local prover. It makes no claim that arbitrary downstream library callers or memory-corrupted processes retain the boundary.

No mismatch was found in the exact scoped mapping. This report does not independently settle ordinary inbound blocks, exact live suffixes, reorgs, authenticated snapshots or the certificate’s `BadAll`/`MissRep`/`BadTypedBind` probability argument.

## Sources

- Certificate theorem: [Category One, “One all-root event”](https://github.com/ignotusnemo/parano1d-soundness/blob/e45cfefd0632ed48d9f2f1975bf5174b5356a37c/docs/category-one.md#L310-L357).
- Certificate source map: [Production acceptance correspondence](https://github.com/ignotusnemo/parano1d-soundness/blob/e45cfefd0632ed48d9f2f1975bf5174b5356a37c/docs/parameter-provenance.md#L72-L84).
- Production model input pin: [model/production.toml, lines 1–6](https://github.com/ignotusnemo/parano1d-soundness/blob/e45cfefd0632ed48d9f2f1975bf5174b5356a37c/model/production.toml#L1-L6).
- Production source paths and immutable line links are cited at each step above.
