# Production snapshot provenance

The executable certificate reads its complete protocol input from
[`model/production.toml`](../model/production.toml). That snapshot is pinned to
Parano1d commit
[`7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`](https://github.com/ignotusnemo/parano1d/commit/7f65daaae414128aa4377ca0ac1e96fd6dbc31a5), which refines the W65 wallet analysis without a protocol change.

The paths and symbols below are relative to that revision. They identify the production definitions from which each snapshot field was taken and the production paths that can accept a terminal State. The standalone calculator does not open or build another checkout. Updating the production source therefore requires a new revision pin, a renewed snapshot and a renewed correspondence audit in the same change.

## Revision renewal audit

The preceding certificate pinned the v1.0.4 release at [`fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0`](https://github.com/ignotusnemo/parano1d/commit/fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0). A direct Git object comparison with the renewed pin found identical blobs for every parameter source and acceptance path listed below except `noid_gkr/src/zk_auth_qrom.rs`. That file changes the analysis radius from `49/64` to `4/5`, the finite candidate bound and the field-exception ledger. Its companion `noid_gkr/src/zk_auth_rbr.rs` updates extractor-side checks, not production proof acceptance.

The W65/H133 geometry, trace and challenge fields, Poseidon2b instance, matrices, native consensus predicates and all acceptance paths below are unchanged. The [wallet derivation](wallet-johnson.md) records the renewed mathematical specialization. The production workspace's integrated `noid_soundness` release tests and the standalone snapshot tests pass, and their exact numerical reports agree after removing the standalone provenance header. This renewal changes analytical bounds, not the protocol or its production acceptance boundary.

## Challenge and digest widths

| Snapshot input | Production source |
|---|---|
| `challenge_min_entropy_bits = 255` | `noid_ivc_core/src/field/gf2_256.rs::C1_CHALLENGE_MIN_ENTROPY_BITS` |
| independent wallet challenge-width check | `noid_gkr/src/zk_auth_qrom.rs::ZK_AUTH_EFFECTIVE_CHALLENGE_BITS` |
| `digest_bits = 256` | `noid_poseidon2b/src/primitives.rs::Digest` |

The snapshot records both challenge-width origins in `[correspondence]`.
`ProductionParameters::load` rejects the snapshot unless they agree with each
other and with the value used by every certificate calculation.

## Wallet authorization

| Snapshot input | Production source |
|---|---|
| inverse rate, query count and query-seed lanes | `noid_fri_binius/src/zk_capsule.rs::{ZK_AUTH_CAPSULE_PARAMETERS,ZK_AUTH_CAPSULE_GEOMETRY}` |
| selected radius `4/5` | `noid_gkr/src/zk_auth_qrom.rs::ZK_AUTH_SELECTED_JOHNSON_PCS_PARAMETERS` |
| field exceptional-set numerator `701,202,001,931` | `noid_gkr/src/zk_auth_qrom.rs::conditional_selected_zk_auth_base_iop_ledger` |
| independent wallet query-count check | the same ledger's `query_term_exponent` |

The query count is stored independently for the wallet ledger and capsule
geometry. Snapshot loading fails if either copy differs from the W65 profile.

## HistoryStep and BaseFold

| Snapshot input | Production source |
|---|---|
| B25 and B255 class selection | `noid_recursive/src/acceptance/history_step_bank.rs::{HISTORY_STEP_CURRENT_CLASS_MS,canonical_history_step_class_id}` |
| message dimensions, rate, codeword lengths and FRI arities | `noid_recursive/src/acceptance/history_step_bank.rs::canonical_history_step_pcs_params` and `noid_ivc_core/src/pcs/commit.rs::PcsParams` |
| plaintext tail lengths | `noid_ivc_core/src/pcs/basefold.rs::fri_commit_layout` |
| `history_step_queries = 133` | `noid_recursive/src/acceptance/history_step_bank.rs::HISTORY_STEP_FRI_QUERIES` |
| `basefold_queries = 133` | `noid_ivc_core/src/pcs/basefold.rs::BASEFOLD_RATE_QUARTER_C1_QUERIES` |
| `zerocheck_k_skip = 6` | `noid_ivc_core/src/zerocheck.rs::K_SKIP` |
| nine joint sidecar groups | `noid_recursive/src/region_sidecar.rs::{JOINT_C1_LINK_GROUPS,JOINT_C1_BLOCK_GROUPS,JOINT_C1_GROUPS}` |

Snapshot loading independently reconstructs the codeword lengths, the
rate-to-dimension relation, the algebraic root bound of 127 and the joint
sidecar root bound of 36. It also rejects any mismatch between the HistoryStep
and BaseFold query counts.

## Fixed Poseidon2b profile

| Snapshot input | Production source |
|---|---|
| width 4, exponent 7, 8 full rounds and 58 partial rounds | `noid_poseidon2b/src/native/permutation.rs::{STATE_SIZE,SBOX_EXPONENT,F_ROUNDS,P_ROUNDS}` |
| rate 2 | `noid_poseidon2b/src/native/compression.rs::RATE` |
| external and internal matrices | `noid_poseidon2b/src/native/permutation.rs::{MDS_FULL,MDS_PARTIAL}` |
| truncated-permutation feed-forward Merkle compression | `noid_poseidon2b/src/native/compression.rs::compress_flat_feed_forward_with_tag` |

These values feed the coherent response-cost calculation in
[`src/resource.rs`](../src/resource.rs) and the published-cryptanalysis audit in
[`src/poseidon2b_cryptanalysis.rs`](../src/poseidon2b_cryptanalysis.rs). The
fixed-permutation delta and coherent response-cost premises are stated
explicitly in [`docs/category-one.md`](category-one.md).

## Production acceptance correspondence

The cryptographic theorem is connected to production acceptance by the following exact paths at the pinned revision.

| Acceptance path | Required authority and checks |
|---|---|
| Ordinary inbound block | `noid_chain/src/storage/mdbx_context.rs::MdbxChainContext::apply_next_block` binds terminal metadata to the uncommitted candidate header, invokes the node's pinned `decode_verify_history_step_terminal`, performs native header, PoW and epoch checks, materializes the public body and requires the resulting exact State root to equal `header.state_root` before commit. |
| Exact live suffix | `verify_history_step_terminal_candidate` verifies the selected tip and returns a non-cloneable `VerifiedHistoryStepTerminal`. `begin_preverified_recursive_suffix` binds it to the current canonical boundary and returns a non-cloneable `VerifiedRecursiveSuffix`. `apply_verified_recursive_suffix_block` advances only along that exact parent/hash sequence, applies the ordinary native checks and exact State materialization to every body, and stores the complete verified terminal only at the selected final tip. |
| Reorg suffix | `authorize_preverified_reorg_suffix` binds the verified terminal to the exact current tip, finalized checkpoint and non-final ancestor. `apply_verified_reorg_suffix_with_applier_indexed` requires a linked replacement ending at the verified tip, requires it to win normal cumulative-work fork choice, applies every body through `apply_verified_recursive_suffix_block`, and commits the complete replacement atomically. |
| Snapshot boundary | `noid_node/src/snapshot_header_staging.rs::SnapshotHeaderStaging::validate_complete` seals a native-validated header chain. `MdbxChainContext::verify_snapshot_boundary` verifies the terminal against its exact boundary and epoch anchor. `noid_chain/src/storage/snapshot_staging.rs::SnapshotStagingSession::finalize` independently reconstructs the streamed State root and live count and requires both to equal the boundary header. `apply_staged_state_snapshot` accepts only matching typed header, terminal and State authorities into one durable State epoch. |
| Local block production | The only non-test production caller of `seal_after_trusted_history_step_proof_unchecked` is `noid_miner/src/block_production.rs::PreparedBlockAttempt::prove`, immediately after the pinned prover returns the terminal for the immutable prepared template. The typed commit rechecks template binding, exact post-State, current parent and PoW. This trusted local-prover bridge is not reachable from inbound, reorg or snapshot acceptance, all of which invoke the verifier. |

The shared semantic core is `noid_recursive/src/accumulator.rs::ChainAccumulator::advance`, `noid_recursive/src/acceptance/history_step/relation.rs::verify_history_step_terminal`, the predicates in `noid_chain/src/consensus/validation.rs` and `noid_chain/src/block.rs::materialize_accepted_block_state`. Together they bind an accepted terminal to one exact native State transition. The typed suffix and snapshot authorities change when that verification is performed, not what terminal or State can be accepted.

## Snapshot integrity

The snapshot is compiled into the binary with `include_str!`. Runtime loading
checks its schema, repository and full revision identifiers, validates every
cross-component equality above and rejects malformed class geometry. Release
tests pin the complete W65/H133 tuple, both History classes, the Poseidon2b
profile, both linear matrices, the Merkle compression mode and the derived root
bounds before evaluating any security result.
