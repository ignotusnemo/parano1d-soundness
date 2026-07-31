# Parano1d soundness workbench

This repository reproduces several **classical** security metrics for the
committed ParanO(1)d production proof parameters and compares them with
metrics published by established proof-system projects.

The source of truth for this revision is ParanO(1)d commit
[`93b0252317208c20f8a769afb74681aa9389e286`](https://github.com/ignotusnemo/parano1d/commit/93b0252317208c20f8a769afb74681aa9389e286).

## Industry comparison

The ParanO(1)d values in this table are derived from pinned production
parameters, reproduced by executable formulas, and fixed by regression tests.
They are therefore ready for direct comparison with projects that publish the
same metrics. This means that the arithmetic comparison is proved and
reproducible; it does **not** turn a conjectured metric into a cryptographic
theorem.

| Published system and metric | Published value | ParanO(1)d under the corresponding metric |
|---|---:|---:|
| [Plonky2 default FRI](https://github.com/0xPolygonZero/plonky2#security), Toy Problem conjecture | **100 bits conjectured**; its default Poseidon configuration is estimated by the project at about **95 bits** | **128 bits conjectured**, using the literal Plonky2/Toy-Problem formula and the production field cap |
| [RISC Zero on-chain verifier](https://github.com/risc0/risc0/blob/release-3.0/risc0/zkp/src/prove/soundness.rs#L15-L35), Toy Problem conjecture | **97 bits conjectured** at `SEGMENT_SIZE = 2^20`; **95 bits conjectured** at `2^24` | **128 bits conjectured**, using the same Toy-Problem-style rate/query calculation |
| [ethSTARK / StarkWare](https://www.starknet.io/blog/safe-and-sound-a-deep-dive-into-stark-security/), round-by-round and `t / e(t)` operation-count analysis | **96-bit RBR** IOP premise; **95-bit** compiled-STARK result under its stated operation-count definition | **96.047-bit** wallet generalized-RBR knowledge bound; **95.022-bit** fixed-invalid-block work-accounted finite composition |

The last row compares the closest corresponding scalar conventions, not
identical protocols. The ParanO(1)d RBR result is for the wallet base IOP, and
the `95.022` figure is the fixed-invalid-block ledger defined in this
repository.

## My position

I do not consider any of these scalar conventions sufficient, on its own, to
characterize real-world post-quantum security. That applies equally to the
larger values produced for ParanO(1)d. These conventions are often presented
as industry metrics, but they compress different security games and assumptions
into a single number:

- the Toy Problem score assumes a conjectured rate-based model and known-attack
  optimality rather than deriving every finite exceptional term;
- the relaxed `t / e(t)` convention measures adversarial work per success and
  is not the stricter statement that every adversary below `2^k` work has
  success probability at most `2^-k`;
- Grover search or amplitude amplification does not justify taking an arbitrary
  classical security number and dividing it by two: preimage search, collision
  search, adaptive transcript attacks, multi-target attacks, and recursive
  composition have different quantum reductions;
- an IOP score is not automatically a statement about its Fiat-Shamir
  compilation, commitment hashes, recursive verifier, or the complete L1
  protocol.

The projects cited above are often careful about these qualifications in their
technical material. When a scoped classical or conjectured score is presented
to users simply as "post-quantum security", however, I regard that presentation
as marketing rather than an end-to-end security theorem.

For a fair public comparison, I nevertheless implemented the same industry
metrics for ParanO(1)d and then went further: the inputs, formulas, finite
ceilings, and resulting values are executable and pinned to production code.
That establishes what ParanO(1)d scores under those published conventions. It
does not erase the remaining QROM obligations or rename a classical result as a
post-quantum proof.

---

*Ignotus Nemo*

## Production inputs

| Component | Queries | Rate | Pre-query grind | Field |
|---|---:|---:|---:|---:|
| Wallet authorization | 64 | 1/32 | 16 bits | GF(2^128) |
| HistoryStep B64 | 125 | 1/4 | 16 bits | GF(2^128) |
| HistoryStep B255 | 125 | 1/4 | 16 bits | GF(2^128) |

The wallet geometry is pinned in
[`zk_capsule.rs`](https://github.com/ignotusnemo/parano1d/blob/93b0252317208c20f8a769afb74681aa9389e286/noid_fri_binius/src/zk_capsule.rs#L558-L577).
The committed BaseFold query floor and grind are pinned in
[`basefold.rs`](https://github.com/ignotusnemo/parano1d/blob/93b0252317208c20f8a769afb74681aa9389e286/noid_ivc_core/src/pcs/basefold.rs#L66-L120),
and the production ladder test fixes B64 and B255 at 125 queries in the
[same file](https://github.com/ignotusnemo/parano1d/blob/93b0252317208c20f8a769afb74681aa9389e286/noid_ivc_core/src/pcs/basefold.rs#L1337-L1351).

## The metrics are not interchangeable

### 1. Literal Plonky2 / Toy-Problem parameter score

Plonky2 checks FRI parameters with

```text
min(field bits, query rounds * rate bits + proof-of-work bits).
```

It calls this a **conjectured** FRI security calculation. Applying that
convention mechanically gives:

| Component | Raw score | Field-capped score |
|---|---:|---:|
| Wallet | `64 * 5 + 16 = 336` | **128 bits** |
| HistoryStep | `125 * 2 + 16 = 266` | **128 bits** |
| Weakest pipeline component | — | **128 bits** |

The exact label is:

> **128-bit literal Toy-Problem-style conjectured classical parameter score**

This score imports a rate-based conjecture. It is not the finite theorem
below and it is not a post-quantum proof.

### 2. Production-radius query-work score

This calculation replaces the raw code rate with the acceptance radius used
by the actual protocol, then charges the 16-bit grind immediately before
query sampling.

Wallet query event:

```text
-log2((3/10)^64) + 16 = 127.165798 bits.
```

For HistoryStep, with `rho = 1/4`, `delta = 3/4`, domain length `n`, and

```text
gamma(n) = delta/2 - 3/(delta*n),
```

the query score is

```text
125 * -log2(1 - gamma(n)) + 16.
```

| Class | Domain | Query-work score |
|---|---:|---:|
| B64 | 2^20 | **100.757887 bits** |
| B255 | 2^21 | **100.758438 bits** |

The weakest-component pipeline score is **100.757887 bits**. Adding one
wallet query event and one HistoryStep query event as probabilities gives
**100.757887 bits** after rounding to six decimals.

The exact label is:

> **100.76-bit production-radius conjectured classical query-work score**

This query-work metric intentionally omits earlier finite exceptional sets.

### 3. Wallet generalized RBR knowledge bound

For the interactive wallet-authorization base IOP, the largest of the 30
per-move generalized RBR errors is the `MainGamma` move:

```text
A_gamma = 4,157,831,958                 BCHKS Theorem 4.6 ceiling
N_gamma = A_gamma + 1 = 4,157,831,959  one affine batching root

epsilon_RBR = N_gamma / 2^128
-log2(epsilon_RBR) = 96.046815694 bits
```

The exact label is:

> **96.047-bit classical generalized RBR knowledge bound**

The complete derivation, candidate-selector lemma, doomed-set construction,
and all 30 move bounds are in
[`docs/wallet-generalized-rbr.md`](docs/wallet-generalized-rbr.md). The maximum
of 27 candidate triples is deterministic extractor work and contributes no
probability term.

This scalar is the maximum per-move generalized RBR error. It must not be
substituted for the ordinary accepting-path bound below.

### 4. Finite no-grind error ledger

Following the calculator style used by RISC Zero, this ledger adds the finite
error terms first and then reports `-log2(sum)`. It assigns no automatic
soundness credit to transcript grinding.

For one wallet authorization:

```text
epsilon_wallet = 8,301,955,018 / 2^128 + (3/10)^64
```

which gives **95.049176 bits**. The numerator is pinned by the production
[RBR ledger test](https://github.com/ignotusnemo/parano1d/blob/93b0252317208c20f8a769afb74681aa9389e286/noid_gkr/src/zk_auth_qrom.rs#L3156-L3169).

For HistoryStep:

```text
epsilon_history(n)
    = (1 - gamma(n))^125
    + (gamma(n) * n + 1) / 2^128.
```

| Class | Query term | Proximity term | Finite sum |
|---|---:|---:|---:|
| B64 | 84.757887 bits | 109.415049 bits | **84.757887 bits** |
| B255 | 84.758438 bits | 108.415043 bits | **84.758438 bits** |

A fixed invalid block with one false authorization and one HistoryStep event
has the conservative additive bound **84.756737 bits per forgery**.

### The max-255 union is a different number

If a one-shot experiment grants one block up to 255 wallet proof events and
accepts when any false proof passes, the direct union bound is

```text
255 * epsilon_wallet + epsilon_history,
```

or **84.490657 bits** without grind credit.

That value is labelled:

> **max-255 one-shot finite union bound**

It is not the operation-count headline. Under the common `t / e(t)` work
definition, generating 255 independent forgery attempts also consumes their
work. Subtracting `log2(255)` after already charging all 255 attempts counts
the same multiplicity twice. A multi-target Fiat-Shamir statement instead
needs one global adversarial work or oracle-query budget.

For completeness, if the mandatory grind is applied only to the query term
that follows it, the corresponding finite compositions are:

| Experiment | Bits |
|---|---:|
| Fixed invalid block / per forgery | **95.021747** |
| Max-255 one-shot union | **87.054734** |

These are printed separately so they cannot be mistaken for the no-grind
finite ledger.

## Run

```sh
cargo run --release
cargo test --release
```

## Primary references

- Plonky2's implementation of
  [`queries * rate_bits + proof_of_work_bits`, capped by the field](https://github.com/0xPolygonZero/plonky2/blob/main/starky/src/config.rs#L119-L126).
- RISC Zero's separation of
  [conjectured and proven regimes](https://github.com/risc0/risc0/blob/release-3.0/risc0/zkp/src/prove/soundness.rs#L15-L35)
  and its explicit
  [sum of error terms](https://github.com/risc0/risc0/blob/release-3.0/risc0/zkp/src/prove/soundness.rs#L97-L118).
- StarkWare's explanation of the common
  [`t / e(t)` operation-count convention](https://www.starknet.io/blog/safe-and-sound-a-deep-dive-into-stark-security/).
- Block et al., [*Fiat-Shamir Security of FRI and Related SNARKs*](https://eprint.iacr.org/2023/1071).
- Block and Tiwari, [*On the Concrete Security of Non-interactive FRI*](https://eprint.iacr.org/2024/1161).
- Block et al., [*On Soundness Notions for Interactive Oracle
  Proofs*](https://eprint.iacr.org/2023/1256).
- Ben-Sasson et al., [*On Proximity Gaps for Reed--Solomon
  Codes*](https://eprint.iacr.org/2025/2055).
