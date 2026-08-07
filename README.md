# Parano1d soundness certificate

This standalone repository instantiates the security analysis for a pinned
Parano1d production proof profile. Cross-component invariants and security
inequalities are evaluated with arbitrary-precision integer or rational
arithmetic.

The analysis inputs are pinned to Parano1d commit
[`a1187ee01b74f889560bac0eb813d5ca49c6fe0d`](https://github.com/ignotusnemo/parano1d/commit/a1187ee01b74f889560bac0eb813d5ca49c6fe0d).
The complete standalone snapshot is
[`model/production.toml`](model/production.toml), and its repository-relative
source-symbol map is
[`docs/parameter-provenance.md`](docs/parameter-provenance.md). The executable
embeds this snapshot and does not import another checkout. A later production
revision requires an explicit snapshot and provenance update.

The repository pins the same Rust `1.96.0` toolchain used by the source
revision.

## Results

| Security statement | Current production result |
|---|---:|
| Target FRI security | **128 bits** |
| Provable Block–Tiwari FS-FRI security | **127 bits** |
| Conjectured Block–Tiwari FS-FRI security | **127 bits** |
| Sequential ideal-QROM half-success boundary | **64.707407428576 bits** |
| NIST Post-Quantum Cryptography Category | **Category 1** |
| Dominant Category 1 gate-depth floor | **173.273866314232 bits** |
| Margin over the NIST `2^170` reference | **3.273866314232 bits** |
| Complete ideal bound at the Category 1 envelope | **0.053364140323608411** |

The first three rows use the classical random-oracle definitions and integer
presentation of Block and Tiwari. The remaining rows concern a different game:
acceptance by a quantum adversary of an invalid terminal State at the end of a
recursive proof chain beginning at genesis.

`C1` is the source identifier for the production wide-challenge profile. Its
algebraic challenges are elements of `GF(2^256)`, sampled uniformly from a
trace-one affine set of cardinality `2^255`. In the security statement,
Category 1 is the NIST Post-Quantum Cryptography resource target referenced to
exhaustive key search against AES-128, including the NIST `MAXDEPTH` limits. The
resource theorem, not the profile name, establishes the assessment.

The fixed Poseidon2b production conclusions are explicit implications:

```text
at T = 2^64:
    Delta_P2b < 0.312471062061564258

at the NIST Post-Quantum Cryptography Category 1 resource envelope:
    Delta_P2b^C1 < 0.446635859676391589
```

The Category 1 result also states the coherent response-cost premise used to
translate oracle queries into logical gates and circuit depth. These conditions
are part of the theorem, not omitted implementation notes.

The certificate also instantiates the algebraic cryptanalysis published in
ePrint 2026/306. Its headline wide-tensor attack family is structurally outside
the production width-four permutation. Appendix A applies to the MDS two-to-one
feed-forward compression used by production Merkle trees. For the snapshotted
`GF(2^128)`, `t=4`, `x^7`, `RF=8`, `RP=58` instance, Theorem 5.1 gives

```text
round skip                 (1, [1, 7])
ideal-degree upper bound   7^73
log2(d_I^2) dedicated algebraic projection   409.873818620410
```

The conclusion is direct: ePrint 2026/306 identifies no attack that lowers the
production security target. The final value is the paper's classical
dedicated-attack projection with `omega=2`, derived from an ideal-degree upper
bound. The fixed-Poseidon2b QROM delta remains the separate premise stated by
the end-to-end theorem. The exact correspondence and calculation are included
in [the Category 1 proof](docs/category-one.md#current-poseidon2b-cryptanalysis).

The complete derivations are in:

- [Block–Tiwari FS-FRI security](docs/block-tiwari.md);
- [end-to-end QROM soundness and the Category 1 assessment](docs/category-one.md);
- [production snapshot provenance](docs/parameter-provenance.md).

## Block–Tiwari comparison

Block and Tiwari define concrete FS-FRI security as the minimum expected
classical random-oracle query work over every positive integer query budget.
Their published comparison and the production Parano1d row are:

| Organization | Repository or configuration | Target | Provable | Conjectured |
|---|---|---:|---:|---:|
| Polygon | Plonky2 | 100 | 38 | 99 |
| StarkWare | stone-prover | 96 | 54 | 99 |
| StarkWare | SHARP Verifier | 96 | 59 | 95 |
| dYdX | dYdX Protocol | 80 | 52 | 79 |
| Polygon Miden | Miden-VM | 96 / 128 | 45 / 67 | 96 / 128 |
| Lambda Class | lambdaworks | 80 / 100 / 128 | 81 / 99 / 127 | 81 / 101 / 129 |
| RISC Zero | RISC Zero | 100 | 37 | 99 |
| Matter Labs | era-boojum | 100 | 50 | 99 |
| **Parano1d** | History B25 / B255 | **128** | **127** | **127** |

Both Parano1d values lie in the exact interval `[127, 128)`. Their whole-bit
values are equal because the 256-bit random-oracle collision term controls the
minimum expected-work scale in both calculations. The descriptive logarithms
of the two exact rational work values are different:

```text
provable    127.194502224322
conjectured 127.207518749639
```

See [the full calculation](docs/block-tiwari.md) for the metric, local RBR
premises, exact optimizer and primary sources.

## Certification basis

`ProductionParameters::load` parses the embedded production snapshot and
constructs the typed analysis tuple. It validates the full source revision,
the independent wallet ledger and geometry values, the HistoryStep and
BaseFold query counts, both canonical History PCS profiles, the
wide-challenge support, the derived algebraic root bounds, the fixed Poseidon2b
profile, both linear matrices and the Merkle compression mode. Construction
fails before any security calculation if a required equality or geometry
invariant does not hold.

The documents define the security games, identify the applicable published
theorems and derive every Parano1d-specific term. Separate Rust types preserve
the distinction between the Block–Tiwari, sequential QROM and depth-aware
Category 1 statements. Probabilities, optimizer boundaries and resource
inequalities are evaluated with arbitrary-size integers and reduced rational
numbers. Floating point is confined to descriptive logarithms. Upper bounds
are rounded upward and sufficient headroom conditions are rounded downward.
Release tests pin the production profile, cover both History classes, exercise
optimizer boundaries and compare normative thresholds by exact integer
inequalities.

Subject to the fixed Poseidon2b delta and coherent response-cost premises stated
in [the Category 1 proof](docs/category-one.md), the resulting inequality bounds
the success probability of every adversary inside the declared resource
envelope by less than one half in the from-genesis invalid-State game.

This repository provides a Category 1 resource assessment for the Parano1d
soundness game. It does not claim that NIST reviewed or certified Parano1d.

## Theorem dependencies

| Layer | Evidence |
|---|---|
| Classical FS-FRI compiler and expected-work definition | Block and Tiwari, linked and instantiated in [`docs/block-tiwari.md`](docs/block-tiwari.md) |
| RBR foundation and Reed–Solomon proximity bounds | Block et al., Ben-Sasson et al. and Haböck, specialized to both production History classes in the same document |
| Sequential QROM lifting and adaptive all-root composition | Chiesa, Manohar and Spooner together with FRACTAL, specialized in [`docs/category-one.md`](docs/category-one.md) |
| Parallel compressed-oracle transition and collision bounds | Chung, Fehr, Huang and Liao, specialized to typed production responses in the Category 1 document |
| Category 1 reference resources | NIST Section 4.A.5, evaluated at every stated `MAXDEPTH` point |
| Published classical Poseidon2b cryptanalysis | Merz and Rodríguez García, specialized to the production permutation and compression mode in [`src/poseidon2b_cryptanalysis.rs`](src/poseidon2b_cryptanalysis.rs) |
| Production correspondence | the full revision pin, standalone snapshot and source-symbol map in [`docs/parameter-provenance.md`](docs/parameter-provenance.md) |
| Numerical conclusions | exact rational arithmetic and release regression tests in this crate |

## Reproduce

Clone the standalone certificate repository and run the default report:

```sh
git clone https://github.com/ignotusnemo/parano1d-soundness.git
cd parano1d-soundness
cargo run --release --locked
```

To print every reduced rational certificate and optimizer boundary:

```sh
cargo run --release --locked -- --exact
```

To verify snapshot validation, exact arithmetic, optimizer boundaries and all
normative result thresholds:

```sh
cargo test --release --locked
```

## Source layout

| Path | Responsibility |
|---|---|
| [`model/production.toml`](model/production.toml) | source-pinned production input snapshot |
| [`docs/parameter-provenance.md`](docs/parameter-provenance.md) | exact source revision and symbol map |
| [`src/parameters.rs`](src/parameters.rs) | parse and cross-check the embedded snapshot |
| [`src/local.rs`](src/local.rs) | wallet and History generalized RBR bounds |
| [`src/block_tiwari.rs`](src/block_tiwari.rs) | exact classical-ROM expected-work optimizer |
| [`src/poseidon2b_cryptanalysis.rs`](src/poseidon2b_cryptanalysis.rs) | source-pinned specialization of published Poseidon2b algebraic attacks |
| [`src/qrom.rs`](src/qrom.rs) | sequential ideal-QROM all-root bound |
| [`src/resource.rs`](src/resource.rs) | depth-aware Category 1 resource calculation |
| [`src/exact.rs`](src/exact.rs) | arbitrary-size rational arithmetic and directed decimals |
| [`src/main.rs`](src/main.rs) | human-readable and exact certificate output |
| [`rust-toolchain.toml`](rust-toolchain.toml) | pinned compiler and formatter toolchain |
