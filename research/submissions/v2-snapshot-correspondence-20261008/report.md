# V2 snapshot admission and durable State correspondence

The v2.0.3 node can install an authenticated snapshot only after full recursive terminal verification for the same header and after reconstructing the exact State committed by that header. A second authentication pass inside the MDBX transaction prevents segment replacement after staging finalization from changing installed State. This supports the selected snapshot correspondence obligation under the existing proof and hash conditions.

## Claim and trust boundary

Production and the integrated certificate are pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. The selected path is `verify_terminal_against_validated_snapshot_headers` followed by `apply_verified_snapshot_boundary`. It includes height-selected v2 bank verification, verified origin admission, finalized segment staging and the atomic snapshot installer.

The falsifiable claim is that this node path cannot successfully install a peer snapshot with different terminal State, segment contents or boundary identity from the full verified terminal's header. A late segment substitution must fail before commit, rolling back the headers, terminal, State metadata and segment writes already staged in the transaction.

The adversary controls peer headers, proof and origin bytes, manifests and segment bytes, and may corrupt staged segment files before installation. The node-owned verifier callback, independently pinned release artifacts, safe Rust capability boundaries and MDBX transaction semantics are trusted. Recursive proof soundness and binding of semantic header identities and exact State roots are the certificate's existing conditions. Arbitrary library callers can supply an accepting callback; the correspondence claim concerns the fixed production node callback.

## Full verification precedes snapshot authority

[Header staging](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/snapshot_header_staging.rs#L435) validates the linked candidate header stream with native consensus rules. [Completion](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/snapshot_header_staging.rs#L607) seals the verified inode, length and content digest before the stream can be used for installation. Header PoW and fork choice remain native checks, distinct from the terminal's proof of validity.

[The node terminal entry point](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/main.rs#L4027) first requires the sealed header boundary to match the immutable `SnapshotId`. It passes the exact tip, epoch header and terminal bytes to [the capability constructor](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_chain/src/storage/mdbx_context.rs#L2354). The constructor checks epoch height, terminal wire limits, height and semantic header identity, and invokes the complete verifier before producing the private `VerifiedSnapshotBoundary`. A valid public prefix alone cannot produce this authority.

[The fixed node callback](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/main.rs#L4217) invokes `HistoryProtocolRuntime::verify_terminal`. [The dispatcher](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_miner/src/history_protocol.rs#L422) selects the bank by candidate height. Mainnet v2 activation is 210537; a configured runtime must use the executable's schedule. Before activation it verifies the legacy terminal. At and after activation it decodes the v2 terminal, obtains the exact verified origin, and invokes the full v2 verifier.

Origin bytes on disk or supplied by peers are evidence inputs, not authority. [Origin installation](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_miner/src/history_protocol.rs#L210) verifies the appropriate legacy or retirement certificate before caching a capability. [Origin lookup](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_miner/src/history_protocol.rs#L361) compares the complete requested origin; after restart, retained bytes undergo verification again. The cache does not accept a terminal.

[V2 terminal verification](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/decision.rs#L98) checks the configured bank, class and verified origin, and binds the accumulator to the exact tip and epoch. It performs full proof replay and checks the fresh matrix claim against the authenticated current matrix. Every live accumulated class must also match its matrix. A carried claim may use the cache only for exact bank, class, shape, matrix digest, complete point and value equality after a prior successful scan. Fresh claims always require evaluation. Thus caching a carried claim cannot convert proof framing into terminal acceptance.

File-based v2 matrices undergo full semantic authentication. Release executables can reuse [build authentication](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_miner/src/v2_artifacts.rs#L64) only for the exact immutable compressed blob and seal emitted together. This is a trusted executable-build boundary, not a peer-selectable shortcut.

## State bytes and the commit boundary

[Finalization](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_chain/src/storage/snapshot_staging.rs#L552) reopens the ordered staged segment files, validates each segment and reconstructs the complete sparse State root and active count. The private finalized capability is produced only when both equal the authenticated header. Descriptor uniqueness, order, range, segment geometry and creation boundaries are checked, so omitted or duplicated segments cannot be hidden by transport framing.

[The node installer](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/main.rs#L15637) requires the verified terminal boundary to match the manifest and keeps both verified capabilities alive while acquiring the sole chain writer. [The chain context](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_chain/src/storage/mdbx_context.rs#L2587) compares the finalized State header, full block hash, verified proof boundary and sealed header source, and requires the complete recent native consensus window.

[The MDBX installer](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_chain/src/storage/mdbx_store.rs#L2490) rechecks canonical base and finality within one write transaction. An allowed nonfinal rebase must stay above finality, remain within the depth limit and win native fork choice. The sealed header stream must end at the exact target and match the supplied recent window. Merely downloading candidate headers does not independently commit them as canonical.

For each segment, [immediate reauthentication](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_chain/src/storage/snapshot_staging.rs#L751) returns one owned byte vector. The installer decodes that vector inside the transaction and uses precisely those bytes for the segment table, owner index, supply count, segment root and global root. It checks creation boundaries, active count and the complete global root again before commit. No later read from a replaceable file supplies installed contents.

Only a successful transaction returns the compact hot State. The context then replaces hot State and consensus fields through infallible assignments. A precommit error drops the transaction and leaves the prior canonical boundary intact. Wallet refresh and GUI progress reporting occur outside this authority chain.

## Conditional correspondence argument

Let H be the immutable snapshot header, T the accepted full terminal, and S the segment bytes written by the snapshot transaction. Successful node installation implies:

1. The production callback fully accepted T under the height-selected runtime and a verified origin, with its accumulator bound to H and the expected epoch.
2. The terminal capability, finalized State, manifest and sealed header source identify the same H and full block hash.
3. The transaction reconstructed `Root(S) = H.state_root` and the exact active count from the same owned bytes written to MDBX.
4. Canonical base, finality and native header authority still matched inside the transaction, which committed all durable components together.

Under terminal soundness and root binding, S therefore corresponds to the terminal's claimed current State. Header validity and fork choice retain their separate native role. A false State installation through this path would require violating one of the stated conditions, the fixed callback boundary, or these explicit equality and transaction checks. This is a source-level argument for snapshot admission, not a proof of the recursive compiler's QROM game.

## Reproduction and review scope

The genuine proof regression uses the archived isolated bank `be82f3bec102f03c63715dac9bb4a939cb9aa5b21d013e38402b321fd8a41fa9`, activation height 10, a retired origin from height 9, and a v2 terminal from height 17. The release legacy bank and both retirement keys remain independently pinned. File-based v2 runtime loading performs full canonical authentication without build seals. The test invokes the production height dispatcher inside `verify_snapshot_boundary`, substitutes header fields and epoch contents, damages the proof after a valid admission, and checks admission after the origin cache is restarted. This isolated evidence cannot establish a mainnet origin before activation.

The original terminal and the terminal after dispatcher restart were accepted. Substitutions of State root, active count, allocation counter, height and previous hash were rejected at the snapshot header binding. Changing the epoch's contents at the same height was rejected by the v2 boundary check. Proof-tail corruption after valid admission was rejected by full proof verification. All seven substitutions failed. Verification alone left the canonical tip at genesis, and no retired legacy matrix was loaded.

The storage regression changes a segment's owner field after successful staging finalization without changing file length. `snapshot_correspondence_late_segment_substitution_rolls_back_every_durable_boundary` checks the genuine transaction installer and requires failure with unchanged durable tip, consensus metadata, State metadata and genesis header, plus absence of the candidate header, segment and terminal. Its private fixture injects an already checked boundary to isolate transaction behavior; it is not presented as proof verification. The separate genuine v2 regression covers that boundary.

All 35 snapshot tests, including this new rollback regression, passed. The 12 focused v2 bank, origin and carried-cache tests also passed under the default mainnet profile. Together with the preprocessing checks, the run contains 50 passing Rust tests and no failures. The complete input archive and passive result digests remain available locally for semantic review.

Run the pinned source plus the recorded audit harness with:

```sh
RAYON_NUM_THREADS=2 cargo test --release --locked -p noid_chain snapshot \
  -- --nocapture --test-threads=1
```

Build `noid_v2_snapshot_correspondence` with `--features noid_chain/isolated-v2-fork-testnet` for the archived activation profile. Supply legacy metadata, isolated v2 metadata, release key directory, retired origin, v2 block, v2 terminal, isolated matrix pack and output JSON. `artifact.json` records exact input hashes, arguments and observations. Supporting source tests cover the bank, origin and carried-claim cache boundaries under the default mainnet profile.

The supporting scope is authenticated snapshot admission and durable installation. Ordinary block application, exact live suffixes, reorg execution and the trusted local producer remain distinct correspondence paths; their historical audit records are not relabeled as this v2 result. Semantic review can attach this evidence to `v2-production-correspondence`; it cannot certify every acceptance path or discharge the all-root, recursive compiler, fixed-hash or response-price conditions. No frontier metric or security-bit improvement is claimed.
