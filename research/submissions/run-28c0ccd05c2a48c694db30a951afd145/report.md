# V2 retirement keys: release-pin authentication versus canonical recomputation

## Target and claim

Affected claim: `v2-retirement-correspondence`. Track: `v2-retirement-binding-audit`, contract v1.0.0. The production and certificate commits are both `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. The research workspace is `parano1d-soundness` at `135733b04f123631ae38aaf0e5a8ec7e6be4adde`.

The October result proved two things. First, the two release preprocessing keys (pins `0651ce50…c8b2` for class 0 and `c301274d…0267` for class 1) equal keys recomputed from the canonical legacy matrices. Second, `RetirementOriginCertificate::verify` binds the request, the point/value, both live classes, four dynamic roots and eleven column openings to those keys. That model lists "correct trusted executable and independent release pins" as an assumption (`artifact.json`, `assumptions`). This audit follows that one assumption into production. It asks how an executable built from 50d6dac obtains the `PinnedRetirementKeys` that close a peer-supplied retirement origin, and which code paths connect them to the canonical matrices.

Falsifiable statements:

- **S1 (source, deterministic).** No path at 50d6dac recomputes a retirement key from canonical matrices or compares it with such a key. This covers build, startup, origin verification and release CI/scripts. The only checks on the embedded key bytes are:
  - (a) the Poseidon2b key digest equals a supplied pin;
  - (b) the key's `shape` and `matrix_digest` fields equal the legacy-bank entry labels.

  The supplied pin is read from `pins.env` inside the same release archive as the key bytes. The only anchor outside that archive is the `v2_pack_sha256` value supplied when the release workflow is dispatched. S1 is refuted by any production path that recomputes static roots, or that checks the key digest against a constant tracked in source.
- **S2 (source, deterministic).** In a v2.0.3 transition build, which still embeds the legacy rows, peer-fetched origin bytes that begin with `O1V2OR02` are verified only by `RetirementOriginCertificate::verify` under those embedded keys. The legacy matrix check is not used for them. So the key-provenance premise already governs acceptance at v2.0.3, not only after `retired-history`.
- **S3 (passive instance check).** For the v2.0.3 release pack, the authenticated `pins.env` is exactly the bank pin `c2a6df73…e76e` and the two October-reconstructed key pins. The key files in that pack hash to exactly those pins. This rules out one specific mismatch for v2.0.3: an executable built through the documented pipeline embedding keys that differ from the reconstructed ones while still passing `from_release`.

## Source trace (immutable locations at 50d6dac)

Base URL: `https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50/`.

1. **Key generation is offline.** `bench_prover/src/bin/noid_retire_history.rs` L251 builds `SparseMatrixProver::from_compact` from authenticated legacy rows. L268 writes `class-{index}.key = key.to_bytes()` and L270 records `key.digest()`. The pin is the digest of the key that this same tool computed, so it is not a second, independent derivation.
2. **Packaging.** `scripts/release_material.py` L25-L26 and L37 list `pins.env` (with `NOID_RETIREMENT_KEY_0/1_PIN`) and `retirement-keys/class-{0,1}.key` as members of the one `history-step-pack-v2` archive.
3. **Release CI.** `.github/workflows/release.yml`:
   - L16: `v2_pack_sha256` is a `workflow_dispatch` input.
   - L167 and L174: the pack is downloaded from the draft release itself, then extracted against that input.
   - L301-L302: the build receives `--v2-pins .release-ci/pack/history-step-pack-v2/pins.env` and `--retirement-keys .release-ci/pack/history-step-pack-v2/retirement-keys` from the same extracted archive.

   `scripts/release_common.sh` L160-L183 parses those pins. `scripts/build_release.sh` L110 and L266 export them as `NOID_RETIREMENT_KEY_{0,1}_PIN`.
4. **Build.** `noid_node/build.rs` L65-L67 requires the three variables for scheduled-v2 release profiles. `embed_retirement_keys` (L249-L263) reads the keys and calls `PinnedRetirementKeys::from_release(bank, keys, pins)`.
5. **Pin check.** `noid_recursive/src/acceptance/history_step/v2/banked/retirement_codec.rs` L34-L53: `from_release` calls `SparseMatrixEvaluationKey::from_bytes_pinned`. That function (`noid_ivc_core/src/matrix_claim/sparse_c1/wire.rs` L106-L137) parses the 304 bytes and requires `key.digest() == pin`. `from_release` then requires `key.shape() == entry.shape()` and `key.matrix_digest() == entry.matrix_digest()` (L45). Nothing relates the seven static roots to the rows. The comment at `noid_ivc_core/src/matrix_claim/sparse_c1/preprocess.rs` L66-L68 says why that matters: attaching a matrix hash to arbitrary roots does not authenticate those roots.
6. **Startup.** `noid_node/src/embedded_history_step_pack.rs` L81-L97 runs the same `from_release` on the embedded bytes and pins. `noid_node/src/main.rs` L1048 and L1068 install the result. `HistoryProtocolRuntime::with_retirement_keys` (`noid_miner/src/history_protocol.rs` L97-L103) checks only the legacy-bank digest.
7. **Acceptance.** `noid_miner/src/history_protocol.rs` L210-L211 dispatches on the peer-chosen magic: `O1V2OR02` goes to `RetirementOriginCertificate::verify(legacy, v2 bank, keys)`, and anything else goes to the legacy path. `noid_node/src/origin_recovery.rs` L223 feeds peer `FetchForkOrigin` bytes into this function. `retain_origin` (L286-L294) also prefers a stored retirement certificate. Whether legacy rows are embedded (`with_legacy_matrix_cache_available`) does not affect the dispatch.
8. **No source anchor.** Searching the production tree finds the key pins and the v2 bank pin only in research result JSON (`research/v2_feasibility/...`, `research/live_agents/...`). No Rust source or consensus parameter refers to them. `noid_chain/src/consensus/params.rs` L19 fixes only the activation height, 210537.

Taken together, `PinnedRetirementKeys` at 50d6dac certifies the following: these bytes are the keys named by the `pins.env` of the archive whose SHA-256 the release operator supplied, and they carry the legacy bank's labels. That is a release-pin check. It is not a recomputation from canonical matrices. In production, the "independent release pins" assumption reduces to the single premise that the release archive is trusted. Evidence of canonicity sits outside the code, in the October reconstruction.

## Passive v2.0.3 instance verification (S3)

Inputs: the October release-input record (`research/evidence/artifacts/2026-10-08-correspondence/input-authentication.json`, `all_release_sha256_match: true`) and the workspace copies `research/certificates/v2.0.3/class-{0,1}.key.gz`.

1. **`pins.env` preimage.** The record gives `history-step-pack-v2/pins.env` as 268 bytes with SHA-256 `cd91ec5ed5dd81bd572c33f729f670514c438c747c82163f7c72769be8b88bff`. The three lines `NOID_V2_RELEASE_BANK=c2a6df736b0d0da22e285b6930b11cf44b520d65b52c7dfe78f44fe0cd48e76e`, `NOID_RETIREMENT_KEY_0_PIN=0651ce507810b61213cbdc0e9f99436aec3a7922cc662bfba6128b466453c8b2` and `NOID_RETIREMENT_KEY_1_PIN=c301274d50dc02fd5c383f2e71629075729a954a768f5051388ec2040bce0267`, in that order and each ending in a newline, are exactly 268 bytes. Their SHA-256 is `cd91ec5e…8bff`. The pins in the authenticated pack are therefore exactly the October pins and the mainnet successor bank.
2. **Key files.** The decompressed workspace keys have SHA-256 `02421f91a13d34480e71e3f8a88071d7e8dcb10ac9ca2339f8a2dea7cb8a689c` and `c655cbb3c3f485b3654d4a0c5d69f108eda504a3a34769a5579aad1fe3b9e8c8`. These equal the pack's `retirement-keys/class-{0,1}.key` entries.
3. **Key headers (decoded fields).**
   - Class 0: m 22, k_log 22, k_skip 6, const_pin field 1 (pin 0), 28,461,463 entries (padded to 2^25), matrix digest `9be6ed11…3d8b`.
   - Class 1: m 24, k_log 24, k_skip 6, const_pin field 1, 124,071,078 entries (padded to 2^27), matrix digest `194a6162…5722`.

   The entry counts match the October table. With r = 2^(k_log+1), the root bound 4(n+r) used in the calculator is 167,772,160 for class 0 and 671,088,640 for class 1.
4. **Digest recomputation.** `SparseMatrixEvaluationKey::digest` (`preprocess.rs` L100-L116) hashes the five u64 fields, the matrix digest and the seven roots. That is exactly wire bytes 8..304 (`wire.rs` `to_bytes`). Using only the production primitive `noid_poseidon2b::native::poseidon2b_hash_byte_slices`, in a scratch copy that does not touch the public repository, I computed `H("NOID/SPARSE-MATRIX-KEY/C1/V1", key[8..])`. The results are `0651ce50…c8b2` and `c301274d…0267`. This step does not use the key types or the verifier code path.

Combined with step 5 of the source trace, a v2.0.3 executable built through the documented workflow embeds exactly the two key files that October reconstructed byte-for-byte. That depends on two things: the pack used being the one whose SHA-256 the record lists, and the record being correct. A mismatch between the shipped keys and the reconstructed keys is ruled out for this release instance.

## Checked and found consistent (context, not the new result)

- **Legacy-to-sparse semantics.** The production v1 acceptance predicate for an accumulated lane is `compact_matrix_claim_values_c1` (`matrix_claim/c1.rs` L1099-L1176). It weights A by `1+s` and B by `s`, where `s` is coordinate `k_log` of the row point. Its eq tables are LSB-first (`zerocheck/field_c1.rs` L36-L60). The sparse key places B rows at `row | 1<<k_log` (`preprocess.rs` L217). Its sumcheck fold, product-tree point assembly, `index_mle` and `write_tag_mle` are all LSB-first. So the sparse statement equals the legacy compact predicate, including duplicate entries (summed both ways) and zero padding.
- **Retirement replay versus v1 terminal checks.** Both call `validate_terminal_metadata` with the boundary headers. The tip class and base flag are checked equivalently (`relation.rs` L1687-L1745, `retirement.rs` L127-L176). I found no omitted non-matrix check.

## Reproduction

1. Obtain the production repository at the pinned commit and the research workspace at `135733b0…`. Read the files and line ranges listed above.
2. Build the 268-byte `pins.env` text exactly as in S3 step 1 and compute its SHA-256. Expected: `cd91ec5e…8bff`. Compare it with `input-authentication.json`.
3. Decompress `research/certificates/v2.0.3/class-{0,1}.key.gz`. Check the SHA-256 values in S3 step 2, and decode the header (magic `N1SPKEY1`, then five little-endian u64 fields, then the 32-byte matrix digest and seven 32-byte roots).
4. Inside a copy of the production workspace (toolchain 1.96.0, `--locked`), call `poseidon2b_hash_byte_slices(b"NOID/SPARSE-MATRIX-KEY/C1/V1", &[&key[8..]])` for each key. Expected outputs are the two pins.
5. For S1 and S2, confirm that `from_release`, `from_bytes_pinned`, `embed_retirement_keys`, `embedded_retirement_keys` and `install_origin_bytes` contain no root recomputation and no comparison with a constant tracked in source.

## Limitations

- This is not a peer-reachable attack. A network adversary cannot replace the embedded keys. The gap matters only if the release archive, or the dispatch-time `v2_pack_sha256`, is wrong or compromised. The October model trusts exactly that, and this report makes the reduction explicit.
- S3 covers the v2.0.3 pack recorded in October only. The obligation stays open for every future pack, including any `retired-history` build, where the keys become the sole link to the legacy matrices. Closing it in source would need either a constant pin tracked in source and reviewed against a recomputation, or a recomputation by build or CI from the embedded canonical v1 rows.
- S3 relies on the October record of the release SHA-256 values. I did not download the GitHub release assets myself. It also relies on Poseidon2b binding of the key digest, and on the October reconstruction for canonicity, which shares the canonical decoder and the PCS implementation.
- I did not re-run the full matrix reconstruction or the PCS, sparse-extraction, L^4, 4(n+r), all-root or response-price arguments. No claim or bound changes.

## Conclusion

The result is inconclusive and scoped. It names one new unresolved obligation: production enforces retirement-key canonicity only by a release-pin check against `pins.env` from the same archive, never by recomputation. Since S2 shows that v2.0.3 transition nodes already rely on these keys for peer-chosen origins, the obligation is acceptance-critical now. For the v2.0.3 instance, the specific mismatch "shipped keys differ from reconstructed keys" is ruled out: an exact `pins.env` preimage and an independent recomputation of the key digests both point to the October-reconstructed keys.
