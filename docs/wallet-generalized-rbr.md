# Wallet authorization: a 96.047-bit generalized RBR bound

This note proves a finite classical generalized round-by-round (RBR)
knowledge bound for the interactive base IOP underlying the production
ParanO(1)d wallet authorization proof.

The result is

\[
  \varepsilon_{\mathrm{RBR}}
    \leq \frac{4\,157\,831\,959}{2^{128}},
  \qquad
  -\log_2 \varepsilon_{\mathrm{RBR}}
    \geq 96.04681569393009.
\]

Rounded to three decimals, this is a **96.047-bit classical generalized RBR
knowledge bound**.

This statement is deliberately narrow. It is not the ordinary accepting-path
soundness error, it does not include the BCS commitment wrapper, and it is not
a QROM or post-quantum claim. Those objects require separate reductions.

## 1. The object being bounded

Let \(F=\mathrm{GF}(2^{128})\) and \(Q=|F|=2^{128}\). The base IOP has 30
verifier moves. A vector challenge sampled in one duplex response is one
verifier move; in particular, `OwnerRho`, `BetaSource`, `BetaMid`, and
`QuerySeeds` are not split into artificial protocol rounds.

The source affine code has production geometry

\[
  n=65\,536,\qquad K=2\,048,\qquad k=K-1=2\,047,
  \qquad \rho=\frac{k}{n}=\frac{2\,047}{65\,536}.
\]

Here \(K\) is the message length and \(k\) is the degree parameter used by
the Reed--Solomon theorem. The selected list-decoding radius is
\(\gamma=7/10\). Seven binary folds preserve rate \(1/32\), producing the
eight codeword lengths

\[
  65\,536, 32\,768, 16\,384, 8\,192,
  4\,096, 2\,048, 1\,024, 512.
\]

The final verifier samples 64 source positions with replacement. If a word is
more than \(7/10\) from the code, the probability that all queries land in
its agreement set is at most \((3/10)^{64}\).

## 2. Generalized RBR knowledge

We use Definition 4.2 of Block, Garreta, Tiwari, and Zając. It assigns one
error \(\varepsilon_i\) to each verifier move. Their Remark 4.5 converts the
vector into the ordinary scalar convention by taking

\[
  \varepsilon_{\mathrm{RBR}}=\max_i \varepsilon_i,
\]

not by summing the errors along an accepting path.

For a public statement \(x\) and fixed source-bank oracle \(S_B\), define
\(K_x(S_B)\) to mean that complete list decoding of \(S_B\) contains a bank
message that passes the exact native authorization predicate `Auth_x`.
`Auth_x` checks the native Poseidon2b trace, sparse boundary, inverse-MDS
secret recovery, and equality of the derived address with the public owner.

The extractor list-decodes the fixed source bank, checks every candidate, and
returns the recovered secret from the first candidate satisfying `Auth_x`.
The list contains at most three candidates, so this is polynomial time once
the standard polynomial-time Reed--Solomon list decoder is fixed.

Define the doomed set recursively:

1. Every empty transcript is doomed.
2. At a doomed prefix, after the next prover message is fixed, every child is
   non-doomed if \(K_x(S_B)\) is true.
3. If \(K_x(S_B)\) is false, only challenges in the explicit escape set for
   that move are marked non-doomed. Every other child stays doomed.
4. Once a path leaves the doomed set, it remains outside it.

If the probability of leaving the doomed set exceeds the stated
\(\varepsilon_i\), the first case must hold and the extractor returns a valid
witness. Section 6 proves that a complete transcript which remains doomed
cannot be accepted.

## 3. The source correlated-agreement term

Apply Theorem 4.6 of Ben-Sasson, Carmon, Haböck, Kopparty, and Saraf (BCHKS)
with \(M=1\). For \(m=3\) and \(h=m+1/2=7/2\), its exceptional-set bound is

\[
  A_\gamma = \left\lceil
    n\frac{2h^5+3h\gamma\rho}{3\rho^{3/2}}
    +\frac{h}{\sqrt\rho}
  \right\rceil .
  \tag{1}
\]

The theorem's multiplicity is indeed three because

\[
  m=\max\left(
    \left\lceil
      \frac{\sqrt\rho}{1-\sqrt\rho-\gamma}
    \right\rceil,
    3
  \right)=3.
\]

The executable formula does not evaluate (1) with binary floating point. Set
\(S=2^{48}\) and

\[
  s=\lfloor S\sqrt\rho\rfloor=49\,746\,066\,706\,335.
\]

The integer certificate

\[
  s^2n\leq kS^2 < (s+1)^2n
  \tag{2}
\]

proves that \(s/S\) is a lower bound for \(\sqrt\rho\). Substituting this
lower bound only into the positive denominators of (1) gives the conservative
rational value

\[
  U=
  \frac{
    203\,228\,569\,801\,111\,718\,241\,482\,309\,632
  }{
    48\,878\,495\,302\,976\,517\,600
  }
  =4\,157\,831\,957.415756\ldots
\]

and therefore

\[
  A_\gamma=\lceil U\rceil=4\,157\,831\,958.
  \tag{3}
\]

Outside this exceptional set, every close codeword for the affine blend
\(B+\gamma C\) descends from source codewords with joint agreement. The fixed
main batching discrepancy is a nonzero affine polynomial in the same
\(\gamma\), so it contributes at most one additional root. Rejected endpoint
values make the verifier reject and are not accepting bad coins. Hence

\[
  N_\gamma=A_\gamma+1=4\,157\,831\,959.
  \tag{4}
\]

## 4. Candidate consistency contributes no probability

Let `Dec_0.7(O)` be the complete list of messages \(p\) satisfying

\[
  \Delta(\operatorname{Enc}(p),O)\leq 7/10
\]

for the observed bank, companion, or mid oracle. The interpolation certificate
caps each list at three.

For completeness, let

\[
  a=\lceil 3n/10\rceil,\qquad D=a-1,
\]

and interpolate a nonzero bivariate polynomial \(R(X,Y)\) of weighted degree
at most \(D\), with weight \(k\) on \(Y\) and \(Y\)-degree at most three,
through the \(n\) received pairs. On the source layer the four coefficient
blocks contain

\[
  19\,661,quad17\,614,quad15\,567,quad13\,520
\]

monomials, respectively: 66,362 unknowns against 65,536 homogeneous
constraints. A nonzero interpolant therefore exists. If a degree-at-most-
\(k\) polynomial \(p\) agrees at \(a\) positions, then
\(R(X,p(X))\) has degree at most \(D=a-1\) and at least \(a\) roots, so it is
identically zero. Thus \(Y-p(X)\) divides \(R\). Since
\(\deg_Y R\leq3\), no more than three distinct candidates exist. The same
integer dimension check has positive margin on every folded layer. Standard
finite-field interpolation and factorization give a polynomial-time complete
decoder.

For candidates \((b,c,m)\), define

\[
\begin{split}
  \operatorname{Chain}(b,c,m;\gamma,\beta_s,\beta_m,t)
  := {}& [m=\operatorname{Fold}_{\beta_s}(V_\gamma(b,c))]\\
       &\land[t=\operatorname{Fold}_{\beta_m}(m)],
\end{split}
\]

where \(V_\gamma\) is the exact Phase-A virtual-oracle map.

**Candidate-selector lemma.** The lexicographic scan of

\[
  \operatorname{Dec}_{0.7}(B)
  \times\operatorname{Dec}_{0.7}(C)
  \times\operatorname{Dec}_{0.7}(M)
\]

returns a witness if and only if the product contains a triple satisfying
`Auth_x(b)` and `Chain(...)`.

**Proof.** Before use, every supplied candidate is re-encoded and rebound to
the actual observed oracle. A returned candidate has passed `Auth_x`, so its
recovered secret is a witness for the public statement, and every coordinate
of both fold equalities has been checked. Conversely, completeness of the
three lists places any satisfying triple in their Cartesian product; the
finite lexicographic loop reaches it and returns. Each list has size at most
three, hence the loop performs at most \(3^3=27\) deterministic checks. ∎

The number 27 is an extractor-work bound. It is neither multiplied into nor
added to the soundness probability.

## 5. Exact move ledger

All field-challenge rows use denominator \(Q=2^{128}\).

| Move | Fixed prover message | Escape-set numerator or probability |
|---:|---|---:|
| 0 `OwnerRho` | source oracle | `11 / Q` |
| 1 `OwnerLambda` | mask evaluation | `1 / Q` |
| 2 `OwnerMleCheckRound(0)` | round polynomial | `10 / Q` |
| 3 `OwnerMleCheckRound(1)` | round polynomial | `10 / Q` |
| 4 `OwnerMleCheckRound(2)` | round polynomial | `10 / Q` |
| 5 `OwnerMleCheckRound(3)` | round polynomial | `10 / Q` |
| 6 `OwnerMleCheckRound(4)` | round polynomial | `10 / Q` |
| 7 `OwnerMleCheckRound(5)` | round polynomial | `10 / Q` |
| 8 `OwnerMleCheckRound(6)` | round polynomial | `10 / Q` |
| 9 `OwnerMleCheckRound(7)` | round polynomial | `10 / Q` |
| 10 `OwnerMleCheckRound(8)` | round polynomial | `10 / Q` |
| 11 `OwnerMleCheckRound(9)` | round polynomial | `10 / Q` |
| 12 `OwnerMleCheckRound(10)` | round polynomial | `10 / Q` |
| 13 `OwnerEta` | terminal claims | `10 / Q` |
| 14 `MainGamma` | companion claim | `4,157,831,959 / Q` |
| 15 `PhaseARound(0)` | round polynomial | `2 / Q` |
| 16 `PhaseARound(1)` | round polynomial | `2 / Q` |
| 17 `PhaseARound(2)` | round polynomial | `2 / Q` |
| 18 `PhaseARound(3)` | round polynomial | `2 / Q` |
| 19 `PhaseARound(4)` | round polynomial | `2 / Q` |
| 20 `PhaseARound(5)` | round polynomial | `2 / Q` |
| 21 `PhaseARound(6)` | round polynomial | `2 / Q` |
| 22 `PhaseARound(7)` | round polynomial | `2 / Q` |
| 23 `PhaseARound(8)` | round polynomial | `2 / Q` |
| 24 `PhaseARound(9)` | round polynomial | `2 / Q` |
| 25 `PhaseARound(10)` | round polynomial | `2 / Q` |
| 26 `BetaSource` | phase-B value and upper | `3,644,593,022 / Q` |
| 27 `BetaMid` | mid oracle | `499,529,882 / Q` |
| 28 `BetaTail` | tail reveal | `1 / Q` |
| 29 `QuerySeeds` | query salt and nonce | `(3/10)^64` |

The seven per-fold BCHKS ceilings are

\[
\begin{array}{r|r}
  \text{fold}&\text{ceiling}\\ \hline
  0&2\,080\,440\,085\\
  1&1\,041\,746\,946\\
  2&522\,405\,991\\
  3&262\,746\,836\\
  4&132\,940\,269\\
  5&68\,084\,528\\
  6&35\,758\,249
\end{array}
\]

`BetaSource` samples three product-uniform coordinates with no intervening
prover message, so sequential conditioning gives

\[
  2\,080\,440\,085+1\,041\,746\,946+522\,405\,991
  =3\,644\,593\,022.
\]

The four-coordinate `BetaMid` move analogously gives

\[
  262\,746\,836+132\,940\,269+68\,084\,528+35\,758\,249
  =499\,529\,882.
\]

Finally,

\[
  Q(3/10)^{64}=116\,842.2057\ldots,
  \qquad
  (3/10)^{64}\leq 116\,843/Q.
\]

Every row is therefore bounded by (4).

## 6. Doomed-set induction

It remains to prove that a complete transcript which stays doomed rejects.

1. **Owner phase, moves 0--13.** Outside the listed roots, the multilinear
   zero-check, affine mask batch, eleven degree-ten sumcheck rounds, and the
   terminal 11-claim random linear combination preserve a false residual.
   The terminal owner relation therefore cannot become true.
2. **Main blend, move 14.** Outside the set in (4), BCHKS list-correlated
   agreement turns proximity of the gamma blend into jointly agreeing source
   candidates, while the extra affine check cannot hide a false main
   relation.
3. **Phase A, moves 15--25.** The standard degree-two sumcheck telescope
   preserves the remaining nonzero residual outside at most two roots per
   round.
4. **Quotient folds, moves 26--27.** Outside the conditional BCHKS sets,
   common agreement propagates through all seven affine quotient layers.
   Product-uniform vector challenges justify the coordinate-wise conditional
   argument without inserting prover adaptivity between coordinates.
5. **Tail link, move 28.** A nonzero affine equality has at most one root, so
   the upper/tail relation closes only if the prior candidate chain is
   consistent.
6. **Queries, move 29.** If \(K_x(S_B)\) is false and every prior challenge is
   nonexceptional, the candidate-selector lemma leaves a discrepancy on more
   than \(7/10\) of source positions. Acceptance requires all 64 queries to
   miss it, the event already charged as \((3/10)^{64}\). Otherwise at least
   one opened position exposes the discrepancy and the verifier rejects.

Thus a doomed final prefix rejects every last response. Together with the
extractor and recursive doomed-set definition in Section 2, this establishes
generalized RBR knowledge with the 30 errors in Section 5.

Taking their maximum gives

\[
\begin{split}
  \varepsilon_{\mathrm{RBR}}
  &=\max_i\varepsilon_i\\
  &=\frac{4\,157\,831\,959}{2^{128}},\\
  128-\log_2(4\,157\,831\,959)
  &=96.04681569393009.
\end{split}
\]

This is an upper bound derived from the cited theorems and exact production
geometry, not a claim that an optimal adversary attains the numerator.

## 7. What the tests pin

The Rust workbench independently checks:

- the Q48 square-root certificate (2);
- the rational numerator and denominator used in (3);
- all eight BCHKS integer ceilings;
- the exact numerator in (4);
- the distinction between 27 deterministic candidate checks and one unit of
  affine soundness error;
- the order and count of all 30 verifier moves;
- both grouped beta sums and the fact that every move is bounded by
  `MainGamma`;
- separation from the `95.049176` ordinary accepting-path finite bound.

Run the checks with:

```sh
cargo test --release
```

## Primary references

- Alexander R. Block, Albert Garreta, Pratyush Ranjan Tiwari, and Michał
  Zając, [*On Soundness Notions for Interactive Oracle
  Proofs*](https://eprint.iacr.org/2023/1256), Definitions 4.1--4.2 and
  Remark 4.5.
- Eli Ben-Sasson, Dan Carmon, Ulrich Haböck, Swastik Kopparty, and Shubhangi
  Saraf, [*On Proximity Gaps for Reed--Solomon
  Codes*](https://eprint.iacr.org/2025/2055), Theorem 4.6.
