# Production snapshot provenance

The executable certificate reads its complete protocol input from
[`model/production.toml`](../model/production.toml). That snapshot is pinned to
Parano1d commit
[`afdce21b6125ae0487c71a9093ab089cb8e88d5a`](https://github.com/ignotusnemo/parano1d/commit/afdce21b6125ae0487c71a9093ab089cb8e88d5a).

The paths and symbols below are relative to that revision. They identify the
production definitions from which each snapshot field was taken. The
standalone calculator does not open or build another checkout. Updating the
production source therefore requires a new revision pin, a new snapshot and a
renewed source map in the same change.

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
| selected radius `49/64` | `noid_gkr/src/zk_auth_qrom.rs::ZK_AUTH_SELECTED_JOHNSON_PCS_PARAMETERS` |
| field exceptional-set numerator `29,163,918,888` | `noid_gkr/src/zk_auth_qrom.rs::conditional_selected_zk_auth_base_iop_ledger` |
| independent wallet query-count check | the same ledger's `query_term_exponent` |

The query count is stored independently for the wallet ledger and capsule
geometry. Snapshot loading fails if either copy differs from the W65 profile.

## HistoryStep and BaseFold

| Snapshot input | Production source |
|---|---|
| B64 and B255 class selection | `noid_recursive/src/acceptance/history_step_bank.rs::{HISTORY_STEP_CURRENT_CLASS_MS,canonical_history_step_class_id}` |
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

These values feed the coherent response-cost calculation in
[`src/resource.rs`](../src/resource.rs). The fixed-permutation delta and
coherent response-cost premises are stated explicitly in
[`docs/category-one.md`](category-one.md).

## Snapshot integrity

The snapshot is compiled into the binary with `include_str!`. Runtime loading
checks its schema, repository and full revision identifiers, validates every
cross-component equality above and rejects malformed class geometry. Release
tests pin the complete W65/H133 tuple, both History classes, the Poseidon2b
profile and the derived root bounds before evaluating any security result.
