# The published response count is an unreduced polynomial-multiplication subtotal

## Finding

This is a resource-accounting challenge, not a cheaper circuit or a universal lower-bound theorem. At certificate commit `e45cfefd0632ed48d9f2f1975bf5174b5356a37c`, the constants called a reversible `GF(2^128)` multiplier (`49,023` logical gates, depth `43`) exactly reconstruct the cited paper's level-7, 128-bit Karatsuba **polynomial** multiplier before modular reduction. The cited paper explicitly excludes modular reduction from those estimates and handles field reduction separately. Production commit `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` uses the field modulus `x^128+x^7+x^2+x+1` and performs reduction in both multiplication calls of every `x^7` S-box. Therefore the recorded `17,648,280` gates and depth `11,352` are a nonlinear subtotal, not an exact complete scalar coherent response circuit and not an upper bound on the minimum cost of that complete relation.

The certificate already acknowledges that linear, routing and control work is omitted. The additional checked point here is that even the primitive labelled `F128_MULTIPLIER` is the source paper's unreduced count. This invalidates the stronger contract/task description of the numbers as a complete exact construction or upper frontier. It does not disprove the separately declared minimum-cost premise; that premise remains an assumption without a universal lower-bound proof.

## Exact target and production correspondence

The checked scalar target is one coherent response for the production Poseidon2b permutation over `GF(2^128)`, width four, rate two, S-box `x^7`, eight full rounds and 58 partial rounds. Any standard coherent response convention that preserves the query and returns or XORs the permutation result must compute the same production permutation, so the field-reduction discrepancy is independent of the final response-register convention.

In `noid_poseidon2b/src/native/permutation.rs`, `permute_flat_u128` applies an initial full MDS layer and then 66 rounds with round constants, 90 total S-boxes and a full or partial MDS layer. `sbox_x7_flat_u128` computes two reduced squarings and two calls to `clmul_gcm`. The production field is defined in `noid_ivc_core/src/field/gf2_128.rs` by `p(x)=x^128+x^7+x^2+x+1`; `ghash_reduce` is part of multiplication. The pinned test `ghash_reduction_smoking_gun` checks the defining witness

`x * x^127 = x^128 mod p = x^7+x^2+x+1 = 0x87`.

An unreduced 128-by-128 polynomial multiplier instead leaves the monomial in coefficient 128 (and has zero in the low 128-bit result), so it is not functionally equivalent to the production field multiplication on this witness.

## Reconstruction of the published subtotal

For `n=128` and seven complete Karatsuba levels, the structural CNOT count from the cited recurrence is exactly

`sum(i=0..6, 3^i * (5*128/2^i - 4)) = 16,218`.

There are `3^7 = 2,187` leaf Toffolis. With the paper's selected decomposition, each contributes six CNOTs, two one-qubit Clifford gates and seven T gates. Hence:

- CNOT: `16,218 + 6*2,187 = 29,340`
- one-qubit Clifford: `2*2,187 = 4,374`
- T: `7*2,187 = 15,309`
- total: `29,340 + 4,374 + 15,309 = 49,023`
- full depth: `5*7 + 8 = 43`

These are exactly the constants in `src/resource.rs`. The source paper states that modular reduction is not included in the Karatsuba estimates and, in its modular-reduction section, gives larger separate totals for actual `GF(2^8)` multiplication. No certificate code emits a reversible circuit or charges the missing reduction: `poseidon2b_response_cost` only multiplies the two numeric constants by the S-box and round counts.

The certificate's exact charged totals are:

- multiplier invocations for forward computation and uncomputation: `90*4 = 360`
- CNOT subtotal: `29,340*360 = 10,562,400`
- one-qubit Clifford subtotal: `4,374*360 = 1,574,640`
- T subtotal: `15,309*360 = 5,511,240`
- gate subtotal: `49,023*360 = 17,648,280`
- depth subtotal: `66*4*43 = 11,352`
- subtotal product: `17,648,280*11,352 = 200,343,274,560`

## Passive reduction schedule demonstrating the omission

For the exact GCM polynomial, a simple reversible all-to-all CNOT schedule reduces the 255 coefficients `c_0,...,c_254`. Process `k=254,...,128` in descending order and, controlled by coefficient `c_k`, toggle coefficients `c_(k-128)`, `c_(k-127)`, `c_(k-126)` and `c_(k-121)`. This is exactly the substitution `x^k = x^(k-128)(1+x+x^2+x^7) mod p`. Descending order propagates every overflow term before it is consumed. The low 128 coefficients end as the production remainder; the high 127 work coefficients remain garbage that is cleaned when the overall compute-copy-uncompute circuit is reversed.

This explicit reduction uses no measurement and no additional ancillas beyond the paper's product/work registers. It costs exactly `127*4 = 508` CNOT gates. A deliberately serial schedule has depth 508 under all-to-all connectivity. Appending this unoptimized reduction after every one of the 360 charged multiplier invocations adds exactly 182,880 CNOTs, producing a partial corrected subtotal of 17,831,160 gates. If each reduction is conservatively serialized after its multiplication, the corresponding partial depth is `66*4*(43+508) = 145,464` and its subtotal gate-depth product is `2,593,791,858,240`.

Those latter figures are a reproducible witness to omitted positive work, not a proposed frontier value: optimized linear synthesis can reduce the reduction depth/count, and the complete response still must charge the two squarings per S-box, initial and per-round MDS layers, round constants, response copy/XOR, ancilla preparation and cleanup, fan-out, controls, and routing under a stated connectivity model.

## Reproduction

The following commands were run from clean detached checkouts at the two required revisions:

```text
git -C certificate-src rev-parse HEAD
git -C production-src rev-parse HEAD
CARGO_TARGET_DIR=../target-certificate cargo test --release --locked
CARGO_TARGET_DIR=../target-certificate cargo run --release --locked -- --exact
CARGO_TARGET_DIR=../target-production cargo test --release --locked -p noid_poseidon2b native::permutation
CARGO_TARGET_DIR=../target-production cargo test --release --locked -p noid-ivc-core ghash_reduction_smoking_gun
```

Observed revisions were exactly `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` and `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`. All 29 certificate tests, four scoped Poseidon2b permutation tests and the production GCM reduction witness passed. The certificate binary printed the stated `17,648,280`, `11,352` and `200,343,274,560` values. The cited primary paper PDF used for the formula and modular-reduction scope had SHA-256 `e8b31e10131585e72369cab6297a1d27224afe45e01ce352d7c622bdabe6b7e0` and DOI `10.3390/s23063156`.

## Limitations and conclusion

I did not synthesize all omitted linear layers, optimize the 128-bit reduction map, give a complete wallet or History circuit, or prove a universal lower bound. Therefore I do not propose a replacement numeric upper or lower frontier. The precise correction is narrower: the accepted three numbers are reproducible arithmetic for unreduced nonlinear components, but they are not the resource count of a functionally equivalent complete production scalar response. The current frontier must not label them an exact construction or an upper bound until a complete circuit with explicit ancillas, garbage cleanup, gate basis, measurement policy and connectivity is provided and reviewed.
