# V2 retirement matrix and request correspondence

The release retirement keys can be checked against the complete canonical legacy matrices independently of the production preprocessing constructor. The production origin verifier also preserves every live legacy matrix obligation, including the class not selected by the boundary terminal, and authenticates its exact request through all eleven sparse column openings. These are scoped correspondence results for the v2.0.3 implementation. PCS soundness, the recursive compiler, fixed Poseidon2b security and the response cost premise remain separate conditions.

## Claim and source

Production and the integrated certificate are pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. The selected entry point is `RetirementOriginCertificate::verify`. The claim is falsifiable: a peer must not be able to replace the key, request, complete point, evaluation value or authenticated column data, or omit a live class, and still obtain `VerifiedOrigin` for the original boundary under the release keys. A release key that differs from independently reconstructed canonical columns would refute the preprocessing part.

The adversary supplies certificate bytes and sparse evaluation proofs. Release pins, authenticated runtime configuration, safe Rust module boundaries and the verifier implementation are trusted. The argument is conditional on binding of the existing commitments and request hashes, and on the algebraic and PCS proof conditions already identified in the certificate. It does not treat unsuccessful mutations as a cryptographic security bound.

## Public preprocessing

[Production preprocessing](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/matrix_claim/sparse_c1/preprocess.rs#L150) builds seven static columns from authenticated A and B entries. The audit reconstructs those columns from `CompactFieldR1cs::open`, which scans the complete canonical artifact against the independently pinned shape and structural digest. It does not use `SparseMatrixProver`, its entry table, `push`, `complete`, `static_column` or tag helpers.

The independent reconstruction enumerates A followed by B, offsets B row addresses by the matrix width, and appends zero coefficient entries until the entry domain reaches its required power of two. For padded length N, entry i has tag `N | i`. Since N is a power of two and `0 <= i < N`, this equals `N + i`: all write tags are nonzero and distinct, and none equals the initial tag zero. The seven columns are row address, column address, coefficient, previous row tag, previous column tag, final row tag and final column tag. Padding participates in both chains, including accesses to address zero.

For each address, the previous tag is the most recent earlier access, or zero; the final tag is the last access, or zero. Thus the reconstructed columns describe the actual canonical access sequence, including initial and final memory records. Matching only the matrix hash written inside a key would not establish this correspondence. Reconstructing all columns and comparing every byte of the 304-byte key checks the actual preprocessing instance, conditional on the shared canonical decoder and commitment implementation.

The two release keys are independently pinned to:

- Class 0: `0651ce507810b61213cbdc0e9f99436aec3a7922cc662bfba6128b466453c8b2`.
- Class 1: `c301274d50dc02fd5c383f2e71629075729a954a768f5051388ec2040bce0267`.

The reconstruction uses the release PCS commitment implementation with separately derived column lengths and parameters. This independence covers table construction, not a second PCS implementation. Matrix artifact hashes, semantic digests, geometries, roots and exact observations are recorded in `artifact.json`.

Both complete keys matched all 304 bytes after reconstruction:

| Legacy class | Canonical nonzero entries | Padded entry domain | Static roots matched |
| --- | ---: | ---: | ---: |
| 0 | 28,461,463 | 33,554,432 | 7 of 7 |
| 1 | 124,071,078 | 134,217,728 | 7 of 7 |

This covers 152,532,541 canonical entries. A separate small-fixture regression compares the independent reconstruction with both resident and compact production preprocessing for three geometries.

## Request and complete claim binding

[Request construction](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/relation.rs#L1716) replays the legacy terminal while leaving its matrix obligations pending. [The private request constructor](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step_bank/retirement.rs#L127) rejects already discharged lanes and checks the actual parent and epoch boundary. A certificate cannot deserialize an asserted checked request.

[The request digest](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step_bank/retirement.rs#L205) includes both banks, the fork schedule, both full headers, the ten boundary lanes, selected class, both matrix identities and shapes, lane presence flags, all coordinates and values of live claims, and the complete fresh claim. Length prefixes delimit variable field vectors. Each F256 coordinate and value retains both 128-bit limbs.

[The reduction verifier](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step_bank/retirement.rs#L319) folds the fresh evaluation into the selected lane and clones the other live lane unchanged. It does not remove the other class because the boundary terminal selected a different class. The reduction codec must name the same request and selected class.

[The sparse transcript](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/matrix_claim/sparse_c1.rs#L127) absorbs the key digest, request context, complete point, complete value and four dynamic commitment roots before reduction challenges. The wire decoder compares its point and value with the independently constructed obligation. Framing and algebraic reduction checks do not themselves grant PCS acceptance.

## Column authentication and origin authority

[Sparse verification](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/matrix_claim/sparse_c1.rs#L413) checks the reduction equations and then authenticates every column opening. Columns 0 through 6 use the release key's static roots. Columns 7 through 10 use the four dynamic roots already absorbed by the transcript. Each opening observes its column index and root before PCS verification, so one column's opening is not interchangeable with another's. The opening inventory is seven static plus four dynamic columns, rather than one proof whose successful parsing covers all columns.

[Matrix closure](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step_bank/retirement/evaluation.rs#L49) requires exactly one evaluation per pending live obligation, in canonical class order, with matching shape and matrix digest. It calls the pinned key's full verifier for every obligation before minting the private checked capability. A missing, duplicate, additional or reordered class cannot be treated as a successfully closed lane.

[The origin entry point](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/retirement_codec.rs#L134) verifies parent PoW, derives the request from legacy replay, verifies the reduction and all sparse evaluations, and calls [the final origin constructor](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/bank.rs#L358). That constructor compares the checked request, target and boundary, the successor bank and schedule, and the independently pinned evaluation key digests. Even the direct library capability route cannot substitute an arbitrary key merely labeled with the correct matrix digest.

The resulting origin digest names the common authenticated boundary and successor configuration. It need not equal the retirement request digest: alternative valid proof transports for the same boundary can produce the same origin. The separate retirement request digest binds the exact outstanding proof obligations.

The node [validates and embeds release keys during the build](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/build.rs#L249) and [reconstructs the pinned key capability at startup](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_node/src/embedded_history_step_pack.rs#L81). Peer certificates contain proofs, not replacement release keys or release pins.

## Genuine request regression

The mutation input is an archived, genuinely accepted isolated-network retirement certificate. Its parent is height 9, successor activation is height 10, selected legacy class is 1, and both legacy classes are live. The archived successor bank is `be82f3bec102f03c63715dac9bb4a939cb9aa5b21d013e38402b321fd8a41fa9`. Its legacy bank and retirement keys are the release instances checked above. The isolated origin is explicitly rejected by the pinned mainnet successor bank `c2a6df736b0d0da22e285b6930b11cf44b520d65b52c7dfe78f44fe0cd48e76e`, whose activation is 210537.

The valid request is derived through production legacy replay and reduction verification. Tests then reject 188 separate coordinate-limb changes, four value-limb changes, four key/context changes, all eight dynamic-root changes at the full origin entry point, and 44 leaf or Merkle-path changes covering every PCS column of both classes. The leaf/path mutations preserve the reduction and successfully decode, then fail specifically at PCS authentication. Both individual live-class omissions, duplicate/reordered/substituted classes and a substituted reduction request also fail. A refusing matrix source records zero attempts to load retired legacy rows.

These tests corroborate the source argument and demonstrate actual acceptance boundaries. They do not enumerate every possible malicious proof or establish the hash, algebraic or QROM bounds.

## Reproduction and review scope

Use the pinned production checkout plus the audit harness identified by `artifact.json`. Authenticate the release matrix packs with their recorded SHA-256 and independent protocol pins before decompressing the two legacy matrices. Set `NOID_CORRESPONDENCE_INPUTS` to the directory containing the two canonical matrices and release keys, then run:

```sh
RAYON_NUM_THREADS=3 cargo test --release --locked -p noid-ivc-core \
  independently_reproduce_pinned_release_key -- --ignored --nocapture --test-threads=1
```

Build `noid_retirement_correspondence` with `--features noid_chain/isolated-v2-fork-testnet` for the archived request, then supply the legacy metadata, isolated successor metadata, mainnet successor metadata, archived certificate directory and output JSON, in that order. The passive artifact records all input hashes and exact command arguments. Full column reconstruction needs several GiB of memory; the audit run caps its cgroup at 16 GiB, disables swap for that group and limits CPU to three cores.

The supporting scope is the concrete release preprocessing instance and the source-level request-to-origin binding. It adds evidence to `v2-retirement-correspondence` after semantic review. It does not discharge the universal sparse extraction theorem, the L^4 candidate envelope, the 4(n+r) root bound, the all-root compiler or minimum response cost. It introduces no consensus, transport or release change and authorizes no frontier metric.
