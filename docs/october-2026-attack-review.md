# October 2026 attacks and the Parano1d soundness certificate

## Certificate result

The mainnet v2 certificate was reproduced on October 13, 2026 from Parano1d v2.0.3 at `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. The complete exact report is byte-for-byte identical to the October 8 report, SHA-256 `f99af13256d02f4cbd6554367a234725fc551806a163624e4cc892ccf0abbebd`.

| Quantity | Reproduced result |
|---|---:|
| Resource assessment | NIST PQC Category 1, under the certificate conditions |
| Typed failure events | 20 |
| Limiting event | `retirement.b25.query` |
| Descriptive log2 dominant half-success gate-depth floor | `173.3897612554174` |
| Ideal success bound at the Category 1 reference envelope | approximately `0.04937388373372754` |

The [exact report](../research/evidence/artifacts/2026-10-13/v2-soundness-mainnet.json) contains the rational inequalities. The [execution receipt](../research/evidence/artifacts/2026-10-13/certificate-reproduction.json) records all four authenticated inputs, protocol pins and the report hash. The assessment uses the certificate's all-root composition, ideal compiler, fixed-Poseidon2b deviation, honest public preprocessing and coherent response-price conditions.

The review covers papers and revisions from October 1 through 13. Four successive publisher catalogue pages contain 262 distinct entries in that window. The checks address the Owner/Main authorization capsule, HistoryStep, sparse retirement and authenticated State installation. They establish the parameter and interface exclusions below.

## Published attack conditions

| Construction | Necessary condition | Production result |
|---|---|---|
| [Poseidon smart subspace restriction, 2026/1692](https://eprint.iacr.org/2026/1692), revised October 4 | The dimension-preserving CICO-2 collapse needs at least two surviving tuple variables. | Width four leaves zero; the published branch requires width at least eight. CICO-1 solves one output lane, while cap verification authenticates both. |
| [Fiat-Shamir PoW, 2026/2326](https://eprint.iacr.org/2026/2326), October 3 | One puzzle must provide both strong PoW and non-amortization with cheap verification. | The local theorem removes grinding and assigns the final nonce zero fixed QROM credit. Its bound does not use that conjunction. |
| [Resettable NIZK, 2026/1036](https://eprint.iacr.org/2026/1036), revised October 8 | The adversary restores or selectively controls an honest prover's private randomness. | Each honest attempt uses independent OS entropy and a fresh PCS commitment. Proof-byte inputs cannot select or restore its private randomness. |
| [SDitH seed recovery, 2026/1808](https://eprint.iacr.org/2026/1808), revised October 12 | Public observations expose the witness XORed with a hidden-leaf seed's VOLE PRG output. | The authorization opening contains algebraic evaluations and commitment hashes, with no VOLE leaf-seed shares. |
| [MQOM root-seed recovery, 2026/1542](https://eprint.iacr.org/2026/1542), revised October 12 | Correlated GGM/BLC openings disclose either a root seed or that seed XORed with a secret prefix. | Merkle siblings are 32-byte commitment hashes; the correlated GGM seed-opening relation is absent. |
| [HOVER, 2026/1778](https://eprint.iacr.org/2026/1778), revised October 13, [GRS recovery, 2026/1747](https://eprint.iacr.org/2026/1747), revised October 7, and [GIJS improvement, 2026/1984](https://eprint.iacr.org/2026/1984), revised October 6 | A private Goppa or alternant-code support and polynomial define the key-recovery target. | Field bases, evaluation domains and preprocessing matrices are public proof parameters, independent of the owner secret. The targeted private code key is absent. |
| [Module-SIS/MLWE, 2026/2420](https://eprint.iacr.org/2026/2420), October 8, [bounded-error LWE, 2026/2426](https://eprint.iacr.org/2026/2426), October 9, and [lattice families, 2026/2386](https://eprint.iacr.org/2026/2386), October 8 | A lattice secret-recovery instance supplies the public samples and hidden secret. | The authorization and recursive validity stack uses binary-field algebra and Poseidon2b commitments. It contains no such lattice instance. |
| [Raptor AVID Plotkin attacks, 2026/2338](https://eprint.iacr.org/2026/2338), October 4 | A threshold attestation accepts R10/RaptorQ fragments before reconstruction. | Native State installation authenticates the exact selected terminal and segment bytes before the atomic commit. It has no Raptor threshold-attestation interface. |
| [Jacobian diagnostics, 2026/1852](https://eprint.iacr.org/2026/1852), revised October 4 | A finite-field multiplicity conclusion requires the theorem's lifting conditions or a second complete satisfying witness. | The large-characteristic separability condition fails in characteristic two. The authenticated selector, carried lanes and retirement closure have direct algebraic source arguments. |
| [Linear RS list bounds, 2026/2048](https://eprint.iacr.org/2026/2048), revised October 6 | The new linear-list theorem requires sufficiently large characteristic. | Production uses characteristic two and retains its finite-domain proximity bounds and query counts. |

## Poseidon2b: width, rank and both digest lanes

The production permutation uses `GF(2^128)`, width four, exponent seven, four initial full rounds, 58 partial rounds and four final full rounds. The exact checker reads the frozen constants and tower-to-flat basis conversion. It verifies `gcd(7, 2^128-1)=1` and all square minors of the external matrix and its inverse: 16 of order one, 36 of order two, 16 of order three and one of order four for each matrix.

For the published Section 4.3 collapse, `k` coordinates supply the particular solution to the backward constraints. The remaining coordinates form tuples of size `k+1`. Each tuple leaves one variable because the corresponding inverse-MDS submatrix has rank `k`. Thus

```text
N_v = floor((t-k)/(k+1)).
N_v >= k  <=>  t >= k(k+2).
```

At `t=4, k=2`, two coordinates remain, fewer than the three required for even one tuple. Hence `N_v=0`, versus the two variables required by the dimension-preserving construction. The exact minor checks also exclude a smaller tuple with a nontrivial kernel. Even reserving no particular-solution coordinates would leave only `floor(4/3)=1` tuple variable, still fewer than two. The baseline partial-round skip `t-2k` is zero.

At `k=1`, one tuple variable survives and the residual partial-round skip `N_v-k` is zero. Applying the two-front-round construction to our schedule leaves two initial full rounds and all 58 partial rounds. The paper's degree-three and reduced-round experiments use a different exponent or front-round schedule. Their optimized systems are not the production system.

The actual tagged compression is

```text
W = (a0, a1, b0 + IV_hi(tag), b1 + IV_lo(tag))
H_tag(a,b) = (P(W)_0 + a0, P(W)_1 + a1).
```

Addition is field XOR. For fixed left input `a` and target digest `h`, the two required permutation outputs are exactly `h0+a0` and `h1+a1`. This is the two-output instance whose dimension-preserving branch is excluded above. If `a` varies, both target equations vary with it; replacing them with fixed permutation-output constants changes the accepted relation.

The native PCS verifier compares complete `[u8; 32]` cap hashes. Both 128-bit lanes also enter the Owner and Main transcripts. A CICO-1 solution constrains one permutation output; acceptance still requires both digest lanes and their feed-forward equations. This establishes why the published one-output result is not a complete commitment opening for Parano1d.

The [October matrix audit](v2-poseidon2b-matrix-audit-2026-10-10.md) reproduces all four 2026/1792 projections, with minimum `1022.830074998558` in their stated semi-regular Macaulay model. [Smoothing regularity, 2026/408](https://eprint.iacr.org/2026/408), revised October 7, studies selected Macaulay systems, and the revised 2026/1692 experiments show the importance of stepwise solving costs. The v2 Category 1 calculation uses its twenty proof-event bounds and declared fixed-hash deviation; these solving-cost projections are separate from that arithmetic.

## Authorization: recovery observations and fresh randomness

SDitH's recovery step uses the observation `witness XOR PRG(hidden_seed, fixed_counter)`. MQOM uses a top BLC seed equal to `root_seed` or `root_seed XOR secret_prefix`; a repeated master seed permits cancellation across two signatures.

Our authorization serializes the Owner proof, source and mid commitments, polynomial data, tail data and authenticated PCS openings. `SourceBatchedMerkleProof` contains sibling commitment hashes. It does not open a VOLE seed tree or a correlated GGM tree. Substituting these hashes for the papers' seed shares does not supply either recovery equation. The named seed-recovery algorithms therefore do not apply to this authorization construction under its commitment and hiding conditions.

The public proving path enters `prove_zk_authorization_from_state`, creates `OsRng`, and invokes the private RNG helper through `zk_capsule_pcs_commit_fresh`. PCS, Libra, terminal-pad and companion randomness are drawn anew for every honest attempt. The private PCS transitions consume their predecessor state, including failed callbacks and retries. A network proof supplies verifier observations, not the honest prover's RNG or a reusable private PCS state.

Under the declared independent OS-CSPRNG entropy condition, the selective-reset operation assumed by 2026/1036 is absent from this proving interface. Eleven authorization tests and twelve PCS tests passed, including independent attempts, all four private masking regions, consumed attempts, failed callbacks, changed public statements and malformed openings. A cloned deterministic RNG stream is the negative control: it reproduces the source commitment, confirming that the checks exercise randomness rather than public-statement changes.

### Fresh-mask repetition bound

The production bank draws 256 `GF(2^128)` Libra cells, 256 padding cells and 1024 PCS cells. Its independent companion draws 2048 `GF(2^256)` cells. In the independent uniform-coin model, a specified complete region repeats between two honest attempts with probability `2^(-bits(R))`. Unioning over all attempt pairs and the four regions gives

```text
Pr[any complete private region repeats]
  <= choose(q,2) * (2^-32768 + 2^-32768 + 2^-131072 + 2^-524288).
```

For `q <= 2^64`, this is strictly below `2^-32639`. The exact checker derives these region lengths from the pinned geometry and checks the integer pair count. This bounds accidental repetition of complete masking regions in the stated coin model.

## Fiat-Shamir and circuit binding

Let `A` be the verifier acceptance predicate with only the grind check removed and `G` its nonce predicate. Actual acceptance requires `A AND G`, which is a subset of `A`. Dropping `G` therefore gives an upper acceptance bound. The certificate models the de-grinded IOP under its compiler conditions, and the wallet ledger assigns the final nonce zero fixed QROM security credit. The 2026/2326 impossibility theorem removes no premise used by this argument: neither a strong-PoW claim nor its conjunction with non-amortization supplies a term in the calculation. Chain PoW separately determines canonical order.

The [October correspondence argument](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/b159eb8c7c5d509ccbfc2102667769703272cd7c/noid_soundness/docs/v2-correspondence-2026-10.md) establishes the canonical preprocessing, complete retirement request, authenticated boolean selector, selected parent and exact inactive-lane carry under its stated algebraic, binding and extraction conditions. These semantic constraints are the relevant test for a changed State or authority.

For characteristic two, `x^2=0` has the unique solution `x=0` while its Jacobian is zero. Consequently a tangent kernel alone does not imply a second valid witness. The large-characteristic condition `2^m < characteristic` in 2026/1852 also fails for any nonempty quadratic subsystem over our field. Those diagnostic corollaries do not invalidate the direct semantic arguments above.

The earlier [OtterSec public-claim binding cases](https://osec.io/blog/zkvms-unfaithful-claims/) concern a concrete missing-statement mechanism. The production Owner prefix absorbs both transaction-body hash lanes, both address lanes and the complete source cap before its first challenges. Native negative controls reject changed statements, caps, rounds, terminal operands and bank claims. These checks establish the binding required at this authorization boundary.

## Reproduction

From this repository, with the pinned production checkout available:

```sh
python3 research/tools/october_attack_screening.py \
  --production /path/to/parano1d \
  --output /tmp/october-attack-screening.json
```

The [calculation record](../research/evidence/artifacts/2026-10-13/attack-screening.json) records fifteen frozen source hashes, all 138 minor checks and the fresh-region repetition bound. The [test record](../research/evidence/artifacts/2026-10-13/reproduction.json) records 64 production test results. The [catalogue record](../research/evidence/artifacts/2026-10-13/literature-window.json) lists the papers and revision dates. From production:

```sh
cargo test --release --locked -p noid_gkr zk_authorization::tests::
cargo test --release --locked -p noid_fri_binius zk_capsule_pcs::tests::
cargo test --release --locked -p noid_soundness
```

The v2 calculator command and its four inputs are specified in [certificate reproduction](october-2026-certificate-refresh.md#reproduction). Today's execution receipt authenticates those same inputs and the identical exact output. The public research verifier passed all 69 tests and verified the existing evidence ledger.

Reviewed PDF hashes are `907b85088cc8c78d0ca84656f7c0e8f008f4690a7e103c5f2df880aafefcb89d` for 2026/1692, `cc2eb7c8d7df1aa78ac02f813c6140d0a0330a18f44890f1092f8e03f5382f4f` for 2026/1036, `5e888b9f3d0f94a59c89754af48255459605b6253ee5ff25694bcd18f0288aea` for 2026/2326 and `048c2bcd864ec34ffae72c4bad9c4529b860040cd1e7a4854b7f0bf9e2fbc1df` for 2026/1542. These copies were retrieved from `eprint.iacr.asia`; revision dates and bibliographic metadata were checked against the publisher pages linked above.
