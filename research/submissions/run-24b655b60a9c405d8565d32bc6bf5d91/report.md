# Parano1d exact live-suffix correspondence audit

## Claimed result

Supports a bounded component of `current-production-correspondence` under contract 1.2.0. The selected production entry point is `noid_node/src/main.rs::apply_exact_suffix_offthread`, specifically its `SyncPlanKind::LiveSuffix` branch. The modeled object is an accepted terminal HistoryStep State and its unique lower-height ancestry in the corrected certificate's **One all-root event** section, especially `docs/category-one.md:332-357`.

Falsifiable statement: every body durably committed by this node path belongs to the fully linked immutable header plan ending at the header passed to the pinned terminal verifier; commit also requires current-base consistency, native header/PoW/epoch checks and exact public State materialization. A body outside that plan, an unverified terminal, a stale base or a mismatching materialized State cannot cross this path's acceptance boundary. This is conditional source correspondence, with no numerical security improvement or frontier movement claimed.

## Method

Obtained the authenticated full workspace archive at `4e86c7276c94e4fb0175e88647d07f56cc3c7a1d`; all 195 tracked files matched Git objects at that revision byte for byte. Independently cloned and checked out both exact source pins below. Read the active contract, certificate input `model/production.toml`, production provenance, the all-root semantic implication, acceptance code and existing regression fixtures before concluding.

The mapping proceeds through the following checked boundaries:

1. `SyncPlan::suffix` checks the first canonical header hash and base extension, then checks each subsequent canonical hash, height and parent link. Private fields and read-only header access preserve this sequence. It derives exactly one terminal claim from the last header. `SuffixSync::into_fetched` consumes complete objects in plan order.
2. Before terminal verification or body commits, `apply_exact_suffix_offthread` checks nonempty matching body/source counts, decodes **every** body, compares its complete header with the matching plan header, and checks the final block ID against the target. This whole-sequence check is essential: the lower-level mutable suffix capability alone only checks the next parent and the final header as bodies arrive.
3. The node selects the tip transaction-epoch anchor from canonical storage or from candidate bodies. `verify_history_step_terminal_candidate` checks metadata height/semantic ID and anchor height, then calls the node's fixed verifier closure. That closure rejects absent runtime and invokes `decode_verify_history_step_terminal`, which decodes and calls the full relation verifier. `validate_terminal_metadata` binds the accumulator to the tip and epoch header; `runtime.decide` follows proof replay and sidecar verification. This is a cryptographic admission boundary, not merely metadata decoding.
4. After acquiring the chain writer, the live branch compares both current height and hash to the original plan base. `begin_preverified_recursive_suffix` consumes the verified capability, rejects reorg staging, and rechecks an anchor at or before the boundary against canonical storage. An anchor inside the suffix is also compared at its body position.
5. `apply_verified_recursive_suffix_block` rejects exhausted or stale authorities, wrong heights/parents, a different final header and a different epoch-anchor header. It runs `validate_block_epoch_anchors` and the ordinary `validate_block_checks` path, including the native PoW-enabled header check.
6. The node supplies the fixed `materialize_accepted_block_state` callback. Its shared `apply_block` works on a cloned State, validates page/slot semantics and transaction applications, then compares the exact State root, active count, allocation counter, slot geometry and transaction root before replacing State. The suffix layer independently checks the returned root. Capability advancement follows successful commit, and the last body stores the complete verified terminal.

Thus, conditional on the certificate's accepted-terminal ancestry and typed-binding assumptions, the prevalidated linked plan fixes the ancestor headers and each materialized body produces the exact header-bound State. In particular, a later body failure can leave a committed valid prefix, but the prefix was already bound to the verified final plan before its first commit. This is consensus State materialization, not a claim about transport throughput or UI behavior.

Public-channel messages 14 and 17 concerned snapshot installation and the local producer. They changed scope selection to this distinct live path; their conclusions were not adopted as evidence for this result. The incremental decision-point channel read found no newer messages. I posted the checked caller-boundary finding as message 18; the incremental pre-submission read after message 18 also found no newer messages.

## Production target

Track: `production-correspondence-audit`

Target claim: `current-production-correspondence`

Production commit: `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` (Parano1d v1.0.4)

Certificate commit: `a5c7e11720117aba5cc28411d8b6916627183616`

Frozen task/workspace commit: `4e86c7276c94e4fb0175e88647d07f56cc3c7a1d`

Research attribution: Andy, AI-assisted with GPT-6 Astra (OpenAI), using Codex. This is a scoped research submission subject to maintainer semantic review.

## Reproduction

Use fresh checkouts of the exact production and certificate commits above. The production fixtures are existing source-pinned tests; no submitted executable is needed. The passive `artifact.json` records source ranges, whole-file SHA-256 hashes, the claim and its assumptions.

- In production: `cargo test --locked -p noid_chain recursive_suffix -- --nocapture`.
- In production: `cargo test --locked -p noid_node --lib networking::sync_plan::tests -- --nocapture`.
- In the corrected certificate: `cargo test --release --locked`.
- In the frozen workspace research directory: `npm ci --ignore-scripts`, then `npm run challenge -- seal --submission <result-directory>` and `npm run challenge -- verify --submission <result-directory>`.

Observed results: production recursive-suffix filter: **7 passed, 0 failed** (330 unit tests and 5 integration tests filtered out); node sync-plan module: **5 passed, 0 failed** (83 filtered out); corrected certificate release suite: **41 passed, 0 failed**. All three commands exited successfully. No production source changes were made. After sealing, the local passive verifier returned `pending-review`: automated checks passed and contract-specific expert review is required.

The suffix tests use injected verifier stubs for control-flow isolation. They test authority and persistence behavior; they do not execute a real recursive proof. The pinned production node's concrete verifier selection is established by the source trace above.

## Limits and negative results

This result supports only the selected node live-suffix path. The public storage API accepts caller-provided verifier and materializer callbacks; arbitrary malicious callers can violate the node's trust boundary. No universal guarantee about all possible library callers is claimed. The earlier apparent gap that an intermediate body can commit before the final header is compared is closed in this selected node flow by whole-plan validation before terminal verification and mutation. Looking only at the storage method would miss this obligation.

No fresh recursive proof, exhaustive epoch-boundary fuzzing, hash-collision attack or complete independent cryptographic proof was produced. Certificate tests establish snapshot/calculator regressions, not the truth of the cryptographic assumptions. Ordinary blocks, reorg atomicity, snapshots and local production are outside the conclusion. No claim is made about current v2 production. A successful local verifier means passive schema/pins/digests are valid and review is pending; it does not confer semantic approval.

## Sources

- [Corrected certificate, One all-root event](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/a5c7e11720117aba5cc28411d8b6916627183616/docs/category-one.md#L310-L357).
- [Corrected production input snapshot](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/a5c7e11720117aba5cc28411d8b6916627183616/model/production.toml).
- [Frozen production correspondence contract 1.2.0](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/4e86c7276c94e4fb0175e88647d07f56cc3c7a1d/research/contracts/production-correspondence-v1.2.0.md).
- [noid_node/src/networking/sync_plan.rs:149-223](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_node/src/networking/sync_plan.rs#L149-L223)
- [noid_node/src/networking/suffix_sync.rs:764-834](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_node/src/networking/suffix_sync.rs#L764-L834)
- [noid_node/src/main.rs:4084-4101](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_node/src/main.rs#L4084-L4101)
- [noid_node/src/main.rs:4176-4389](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_node/src/main.rs#L4176-L4389)
- [noid_chain/src/storage/mdbx_context.rs:201-255](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/storage/mdbx_context.rs#L201-L255)
- [noid_chain/src/storage/mdbx_context.rs:1454-1610](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/storage/mdbx_context.rs#L1454-L1610)
- [noid_chain/src/storage/mdbx_context.rs:2413-2519](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/storage/mdbx_context.rs#L2413-L2519)
- [noid_chain/src/block.rs:159-248](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/block.rs#L159-L248)
- [noid_recursive/src/accumulator.rs:174-263](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_recursive/src/accumulator.rs#L174-L263)
- [noid_recursive/src/acceptance/history_step/relation.rs:791-814](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_recursive/src/acceptance/history_step/relation.rs#L791-L814)
- [noid_recursive/src/acceptance/history_step/relation.rs:1540-1608](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_recursive/src/acceptance/history_step/relation.rs#L1540-L1608)
- [noid_recursive/src/acceptance/history_step/wire.rs:641-649](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_recursive/src/acceptance/history_step/wire.rs#L641-L649)
- [noid_chain/src/consensus/validation.rs:320-440](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/consensus/validation.rs#L320-L440)
- [noid_chain/src/consensus/header.rs:155-208](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5/noid_chain/src/consensus/header.rs#L155-L208)
