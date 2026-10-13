# V2 Poseidon2b matrix audit reproduction

The nonlinear-subspace audit has been reproduced from the Poseidon2b implementation shipped in Parano1d v2.0.3, production commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. This establishes the concrete balancing rank, the permitted trail lengths and all four exact Macaulay projections recorded by the current `poseidon2b-nonlinear-subspace-reproduction` contract. The result supplies the source-linked evidence for `v2-poseidon2b-classical-audit` on noid.network.

## Parameters and conditions

The calculation uses the production `GF(2^128)` field, width four, two digest lanes, eight full rounds, 58 partial rounds, exponent seven and one active S-box per partial round. It specializes the algebraic construction in [ePrint 2026/1792](https://eprint.iacr.org/2026/1792), reviewed version `20260824:125701`, PDF SHA-256 `006cf8bc3b47df053d662b6552aa82fd8add2a75a152e08f9c63db73a29564cb`.

The constraint budget is `E_c = t - d = 2`. The concrete even-construction balancing core, evaluated in the production tower basis, is `0x0000000000000000000000000000be32`. Its nonzero value supplies the required rank check for this matrix. The linear trail spans two partial rounds and the nonlinear trail spans four. The production basis change preserves rank.

The cost projections use the stated semi-regular Macaulay model with `omega = 2` and the degree cap `D(e) = min(7^e, 2^128 - 2)`. Exact integer arithmetic searches every permitted substitution placement and computes the matrix dimension and its square.

| Model | Placement | Variables | Descriptive `log2(C_Macaulay^2)` |
|---|---:|---:|---:|
| Forward, substitution, linear subspace | `tau = 28` | 6 | `1090.060133886114` |
| Forward, substitution, nonlinear subspace | `tau = 27` | 8 | `1403.209025315336` |
| Forward, no substitution, linear subspace | direct | 4 | `1022.830074998558` |
| Forward, no substitution, nonlinear subspace | direct | 4 | `1022.830074998558` |

The two direct projections have distinct exact dimensions. Comparing the exact squares selects the linear direct model as the minimum in this four-model family.

## Reproduction and artifacts

The production commit was exported with `git archive` into a fresh directory and built with its pinned Rust toolchain and locked dependencies, using two Cargo build jobs. The integrated calculator was executed with:

```sh
cargo run --release --locked -p noid_soundness -- --exact
cargo test --release --locked -p noid_soundness
```

All 41 integrated calculator unit tests passed. The complete `POSEIDON2B NONLINEAR SUBSPACE REVIEW` section matches the frozen contract byte for byte. Its SHA-256 is `9d470579d6275b56a6938db5e87c7d331e7804cc12db45b68625fe0f24dbdc6f`.

A separate arbitrary-precision integer calculation reproduced all four exact matrix dimensions, their squares and the minimizing placements. It evaluated all 57 linear and 54 nonlinear substitution placements using the four expressions published in the pinned [production analysis](https://git.parano1d.org/ignotusnemo/parano1d/src/commit/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_soundness/docs/poseidon2b-august-2026.md#production-cost-projections).

The public artifacts are the [complete exact section](../research/evidence/artifacts/2026-10-10/poseidon2b-nonlinear-subspace-exact.txt), the [independent integer cross-check](../research/evidence/artifacts/2026-10-10/projection-cross-check.json) and the [execution receipt](../research/evidence/artifacts/2026-10-10/poseidon2b-execution-receipt.json). The current task remains available for independent reproductions and further analysis of the production parameters.
