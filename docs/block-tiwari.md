# Block–Tiwari concrete security of production FS-FRI

## Result

Using the definitions and whole-bit presentation of Block and Tiwari, the
pinned Parano1d History profile gives:

| Target FRI security | Provable FS-FRI security | Conjectured FS-FRI security |
|---:|---:|---:|
| **128** | **127** | **127** |

The exact expected-work values have the following descriptive logarithms:

\[
\begin{aligned}
\lambda_{\rm provable}&=127.194502224322\ldots,\\
\lambda_{\rm conjectured}&=127.207518749639\ldots.
\end{aligned}
\]

Both exact rational results lie in `[127, 128)`, so both are displayed as 127
bits. This equality is not an identification of the two RBR premises. It means
that the 256-bit random-oracle collision term places both expected-work minima
inside the same integer interval.

## Security definition

Block and Tiwari consider a classical adversary making `Q` queries to a random
oracle with `kappa` output bits. If the underlying interactive protocol has
round-by-round error `epsilon_rbr`, their compiler bound is

\[
\varepsilon_{\rm BT}(Q)=\min\left\{1,
Q\varepsilon_{\rm rbr}+\frac{3(Q^2+1)}{2^\kappa}
\right\}.
\tag{1}
\]

The expected query work needed to obtain one successful forgery is

\[
W(Q)=\frac{Q}{\varepsilon_{\rm BT}(Q)}.
\tag{2}
\]

Concrete security is the minimum over every positive integer query budget:

\[
\lambda=\log_2\left(\min_{Q\in\mathbb Z_{>0}}W(Q)\right).
\tag{3}
\]

The final whole-bit value is the largest integer `k` for which the exact
minimum is at least `2^k`.

## Production inputs

The calculator reads the following values from production source definitions.

| Input | Production value |
|---|---:|
| History classes | B64 and B255 |
| Codeword lengths | `2^20` and `2^21` |
| Code rate | `1/4` |
| BaseFold queries | 133 |
| C1 challenge support | `2^255` |
| Random-oracle digest | 256 bits |
| Maximum algebraic roots per list candidate | 127 |
| Joint sidecar roots per list candidate | 36 |

The B64 layer domains run from `2^8` through `2^20`; the B255 layer
domains run from `2^9` through `2^21`. Every domain in both schedules is
included in the local theorem calculation.

The RBR input is proved for the de-Merkleized and de-grinded public-coin IOP.
Its algebraic challenges use the production trace-one support in
`GF(2^256)`, which is uniform over exactly `2^255` elements. The final nonce
predicate supplies no RBR credit. The 133 query positions are disjoint windows
of one atomic vector response and are independent and uniform with
replacement.

## Provable RBR premise

Let `m >= 3` be the integral Johnson multiplicity and define

\[
h=m+\frac12,
\qquad
\gamma=\frac{m-1}{2m},
\qquad
s_N=\frac{N-4}{2N}.
\tag{4}
\]

For the production rate-one-quarter Reed–Solomon layers, the reduced rate in
the degree convention of the list-correlated theorem is

\[
\rho_N=\frac{N/4-1}{N}=\frac14-\frac1N.
\]

Direct expansion gives `s_N^2 < rho_N`, so `s_N` is a strict rational lower
bound on `sqrt(rho_N)`. For `gamma=(m-1)/(2m)`, the required multiplicity
satisfies

\[
\left\lceil
\frac{\sqrt{\rho_N}}{1-\sqrt{\rho_N}-\gamma}
\right\rceil\le m
\]

on every production layer. The ratio is strictly below `m` because
`sqrt(rho_N) < 1/2` and its denominator is greater than `1/(2m)`.
Instantiating Theorem 4.6 of Ben-Sasson, Carmon, Haböck, Kopparty and Saraf
and replacing `sqrt(rho_N)` by the smaller rational `s_N` gives the following
integral upper envelope on exceptional challenges:

\[
A_N(m)=\left\lfloor
N\frac{2h^5+3h\gamma s_N^2}{3s_N^3}+\frac{h}{s_N}
\right\rfloor.
\tag{5}
\]

The corresponding strict integral list bound for an initial class codeword is

\[
L_N(m)=\left\lceil\frac{h}{s_N}\right\rceil-1.
\tag{6}
\]

Only the initial committed codeword supplies the candidate list used by later
algebraic checks. Define

\[
L_{\max}(m)=\max\{L_{2^{20}}(m),L_{2^{21}}(m)\}.
\]

The list-decoding query escape term for 133 independently sampled positions is

\[
E_q(m)=\left(\frac{m+1}{2m}\right)^{133}.
\tag{7}
\]

The production algebraic inventory contains at most 127 roots for one list
candidate. The joint C1 sidecar contains nine transcript groups and four
Poseidon lanes, giving 36 roots per candidate. Therefore the proved local
History RBR bound is

\[
\begin{aligned}
\kappa_H(m)=\max\{&E_q(m),
\max_N A_N(m)/2^{255},\\
&L_{\max}(m)\cdot127/2^{255},
L_{\max}(m)\cdot36/2^{255}\}.
\end{aligned}
\tag{8}
\]

The maxima range over every B64 and B255 layer described above. Equation (8)
accounts for candidate switching explicitly. It does not assume that a decoder
keeps the same candidate after later challenges.

To justify that statement, pack the 32 interleaved initial rows into one word
over a fixed degree-32 extension. This preserves column Hamming distance and
gives one initial list of size at most `L_max(m)`. In every nonexceptional
row-batch or position fold, list-correlated agreement restores every selected
post-fold candidate to correlated pre-fold candidates on the same weighted
agreement set. The additive-NTT butterfly used by production is invertible,
so Haböck's additive-FFT BaseFold reduction applies unchanged.

Every restored candidate agrees with the committed base-field rows on more
than `N/2` positions, while its degree is below `N/4`. Frobenius conjugation
and polynomial uniqueness force each decomposed row into the embedded
`GF(2^128)` subfield, so the extractor returns a production-shaped witness.

All later false identities are nonzero polynomials in the next verifier coin.
Unioning their roots over the complete fixed initial list yields the 127 and
36 terms in equation (8). Grouped Merkle epochs only contract deterministic
fold paths. The weighted backward graph argument bounds the remaining
accepting initial fraction by `(m+1)/(2m)`, and 133 independent queries give
equation (7).

The exact root inventory is bounded by 7 for public-input compression, 19 for
a sidecar multilinear point, 36 for the joint nine-group sidecar batch, 8 for
a ragged-walk sumcheck round, 18 for zerocheck coordinate compression, 127 for
the zerocheck interpolation challenge, 63 for the deferred inner coordinate,
2 for other sumcheck rounds and 1 for joint lincheck or PCS claim batching.
Thus 127 is a maximum over the complete production verifier schedule.

A straight-line extractor list-decodes the packed initial word, decomposes
each candidate into 32 base-field rows, inverts the additive NTT and accepts a
candidate only after the exact History relation succeeds. Backward induction
over doomed prefixes shows that an accepting no-witness transcript must leave
the doomed set through one of the four events in equation (8). Thus equation
(8) is a generalized round-by-round knowledge bound, not only a terminal
acceptance estimate.

As `m` increases, equation (7) decreases while all finite list and proximity
terms are nondecreasing. The minimum is consequently adjacent to their unique
crossing. The calculator finds that crossing by exact integer binary search and
compares the two adjacent values as rational numbers. The production minimum
is

```text
m = 861824
```

and its maximum term is the query escape term. This exact value is used as the
provable `epsilon_rbr` input to equation (1).

## Conjectured RBR premise

Block and Tiwari's conjectured FRI premise is the maximum of the challenge
floor and the rate/query term. For the production profile,

\[
\begin{aligned}
\varepsilon_{\rm rbr}^{\rm conjectured}
&=\max\{2^{-255},(1/4)^{133}\}\\
&=\max\{2^{-255},2^{-266}\}\\
&=2^{-255}.
\end{aligned}
\tag{9}
\]

The 255-bit challenge support in equation (9) and the 256-bit digest in
equation (1) are different production parameters and remain separate in the
calculation.

## Exact global optimizer

Write `a = epsilon_rbr` and `b = 3/2^256`. Before equation (1) reaches its
probability cap,

\[
W(Q)=\frac{1}{a+b(Q+1/Q)}.
\tag{10}
\]

For integral `Q >= 1`, `Q + 1/Q` is nondecreasing. Thus `W(Q)` is
nonincreasing before the cap. After the cap, `W(Q)=Q` and is strictly
increasing. The global minimum is therefore either the final uncapped integer
or the first capped integer. No preselected attack budget or floating-point
search is needed.

For the provable premise, exact binary search gives:

```text
last uncapped Q = 194697534987145646766651744479049925879
first capped Q  = 194697534987145646766651744479049925880
global minimizer = last uncapped Q
log2 W(Q) = 127.194502224322...
```

For the conjectured premise:

```text
first capped Q = 196462116142286827589391637123844718211
global minimizer = first capped Q
log2 W(Q) = 127.207518749639...
```

In both cases exact power-of-two comparisons prove

\[
2^{127}\le \min_Q W(Q)<2^{128}.
\tag{11}
\]

Equation (11), rather than a rounded logarithm, is the whole-bit certificate.

## Comparison

Block and Tiwari publish the following FS-FRI results. The Parano1d row applies
the same definitions, 256-bit random-oracle setting and integer presentation
to the production parameters derived above.

| Organization | Repository or configuration | Target FRI security | Provable FS-FRI security | Conjectured FS-FRI security |
|---|---|---:|---:|---:|
| Polygon | Plonky2 | 100 | 38 | 99 |
| StarkWare | stone-prover | 96 | 54 | 99 |
| StarkWare | SHARP Verifier | 96 | 59 | 95 |
| dYdX | dYdX Protocol | 80 | 52 | 79 |
| Polygon Miden | Miden-VM | 96 / 128 | 45 / 67 | 96 / 128 |
| Lambda Class | lambdaworks | 80 / 100 / 128 | 81 / 99 / 127 | 81 / 101 / 129 |
| RISC Zero | RISC Zero | 100 | 37 | 99 |
| Matter Labs | era-boojum | 100 | 50 | 99 |
| **Parano1d** | History B64 / B255 | **128** | **127** | **127** |

The Parano1d provable value matches the highest provable whole-bit value in
the published table. Its conjectured value is one bit below Miden's 128-bit
configuration and two bits below the lambdaworks 128-bit configuration. Both
Parano1d columns are one whole bit below the assigned target.

## Reproduction

From the repository root:

```sh
cargo run --release --locked
cargo run --release --locked -- --exact
cargo test --release --locked
```

`--exact` prints both RBR fractions, both minimizing query budgets, both cap
boundaries and both exact minimum expected-work fractions.

## Sources

- Alexander R. Block and Pratyush Ranjan Tiwari,
  [*On the Concrete Security of Non-interactive FRI*](https://eprint.iacr.org/2024/1161),
  Definitions 1 and 2, Lemma 1, Conjecture 1, Section 4 and Table 1.
- Block and Tiwari,
  [FRI parameter-analysis code](https://github.com/alexander-r-block/FRI-Parameter-Testing-Sagemath),
  including the 256-bit random-oracle comparison setting.
- Alexander R. Block, Albert Garreta, Jonathan Katz, Justin Thaler, Pratyush
  Ranjan Tiwari and Michał Zając,
  [*Fiat-Shamir Security of FRI and Related SNARKs*](https://eprint.iacr.org/2023/1071).
- Eli Ben-Sasson, Dan Carmon, Ulrich Haböck, Swastik Kopparty and Shubhangi
  Saraf,
  [*On Proximity Gaps for Reed-Solomon Codes*](https://eprint.iacr.org/2025/2055),
  Theorem 4.6.
- Ulrich Haböck,
  [*BaseFold in the List Decoding Regime*](https://eprint.iacr.org/2024/1571).
