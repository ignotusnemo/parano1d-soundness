# October 2026 soundness review and v2.1 certificate renewal

The renewed certificate covers the published Parano1d v2.1.0 bank and its complete retained ancestry. Native source replay confirms Small, Large and Native geometry and the selected authorization ledger. The exact calculation retains twenty historical events and adds six current events. Their maximum densities preserve the dominant half-success gate-depth floor, approximately 173.3897612554174 bits, and the ideal Category 1 success envelope, approximately 0.04937388373372754, under the stated extraction, composition, fixed-permutation, preprocessing and response-price conditions.

The October literature review adds explicit checks of binary-field Johnson margins, finite-list MCA applicability and finite-field Jacobian diagnostics. It also sharpens the extraction interface and total-budget conditions for the existing research tasks. The current matrix and query configuration is retained. The [certificate derivation](v2.1-certificate.md) gives the exact extension argument and research obligations.

## Review window and source record

The monthly window is October 1 through 31, 2026. Collection on November 6 used eight consecutive pages of the publisher's [recent-paper catalogue](https://eprint.iacr.org/days/183?offset=0), covering the current listing back through September 30. The screen contains 783 distinct catalogue entries whose latest listed update falls on or after October 1. Of these, 648 have an October update date and 135 have a November update date. Titles and catalogue abstracts were screened for proof soundness, extraction, random-oracle composition, code proximity, cryptanalysis, preprocessing and circuit constraints. The metadata manifest records the full screening set, selected papers, retrieval locations and SHA-256 values.

This is a deliberately inclusive screening set. November entries can contain revisions of October work, so their publication histories were inspected for the relevant selected papers. The report identifies later revisions explicitly. Papers received on October 30 or 31 but approved on November 4 are included as late-October submissions. The earlier [October 13 interim review](october-2026-attack-review.md) remains available with its original source and execution receipts.

Primary paper links below identify the authors' ePrint records. Some PDFs were retrieved through the ePrint Asia mirror when the primary PDF endpoint rejected retrieval. Their exact bytes and retrieval URLs are recorded in the [literature manifest](../research/evidence/artifacts/2026-11-06/literature-review.json). The catalogue was screened broadly. Detailed mathematical review concentrates on the mechanisms and theorem hypotheses relevant to this construction.

## Binary fields, proximity and common agreement

[Counterexamples to Beyond-Johnson Proximity Gaps over Binary Fields, 2026/2424](https://eprint.iacr.org/2026/2424), first received October 9, constructs binary-field counterexamples in specified beyond-Johnson regimes. The inspected PDF is the November revision, not the original October edition. Its examples make the radius and characteristic conditions decisive.

For authorization the agreement is 1/5 and the code rate is 1/32. At every checked layer, `(1/5)^2 > (K-1)/N`. History and retained sparse openings use rate 1/4 and agreement `(m+1)/(2m)`, with their respective positive multiplicities. This exceeds 1/2 and hence exceeds `sqrt((K-1)/N)` at every finite layer. The executable [applicability checks](../research/tools/october_2026_checks.py) compare squared rationals for the current classes, previous classes, both legacy classes and all twenty-two retained sparse columns. Their receipt lists every domain and its positive margin.

[Mutual Correlated Agreement and List-Decoding: Improvements and Separations, 2026/2617](https://eprint.iacr.org/2026/2617), received October 23 and revised November 3, distinguishes list decoding from MCA. Its Theorem 2 gives a finite-list correction to the generic square-root transfer threshold. At authorization radius p = gamma = 4/5 and list envelope L = 17, the theorem's exact positive-gap expression is negative. Our check evaluates that expression as a rational. Consequently the certificate explicitly requires the RS-specific grouped common-agreement and source-restoration statement at the selected radius. Establishing a small candidate list supplies the candidate count. Establishing the required shared agreement is a separate mathematical obligation.

[Reed-Solomon Codes Beyond Johnson, 2026/2056](https://eprint.iacr.org/2026/2056), first received in September and inspected in its November 3 revision, gives derivative-based beyond-Johnson results requiring characteristic zero or a prime larger than specified degree bounds. Those hypotheses exclude characteristic two. The same paper's above-Johnson result applies in every characteristic, but its asymptotic notation supplies no new explicit numerical constant by itself. The certificate continues to evaluate its existing finite-domain expression. [Linear list size bounds, 2026/2048](https://eprint.iacr.org/2026/2048), revised October 6, likewise requires its stated large-characteristic conditions for the improved beyond-Johnson conclusion.

The exact layer tests establish which numerical radius regime applies. The ongoing proof task is to instantiate the required RS-specific grouped agreement theorem and source restoration for the actual fold schedule, commitments and candidate convention.

## Fiat-Shamir, extraction and recursive children

[Beyond Standard Indifferentiability, 2026/2708](https://eprint.iacr.org/2026/2708), received October 31 and approved November 4, distinguishes three extractor interfaces. Its transfer theorems require progressively stronger reconstruction properties when extraction consumes an internal transcript or rewinds a persistent simulator. The formal statements quantify probabilistic polynomial-time algorithms and classical transcripts. Applying their conclusions to quantum oracle access requires a separately justified quantum specialization.

For the current recursive proof, the useful obligation is a coupled compiler: the same experiment must relate arithmetized native children, ideal oracle records, extracted local witnesses and the final accepted root. The reviewed [PR 24](https://git.parano1d.org/ignotusnemo/parano1d-soundness/pulls/24) isolates a fixed-child hybrid problem. Independent enumeration reproduces its 256-case toy and its one-quarter challenge agreement. The maintainer review classifies the result as inconclusive and records the concrete child-idealization obligation. The all-root task now explicitly asks for this coupling, including adaptive scheduling and the shared oracle history.

[Critical-Round Special Soundness, 2026/1679](https://eprint.iacr.org/2026/1679), revised October 12, extracts from a critical subtree with a quantified fallback for the full tree. Its examples cover named MPC-in-the-head, KZG-compiled and sumcheck constructions. Using that result here requires instantiating its extractor and fallback predicates for the source-restoration protocol. The critical-round label alone supplies neither that instantiation nor a quantum compiler.

[Knowledge soundness in the AGM, 2026/284](https://eprint.iacr.org/2026/284), revised October 29, and [the PST extractability note, 2026/2398](https://eprint.iacr.org/2026/2398), October 7, examine specific group-based commitment guarantees and extractor gaps. They reinforce the need to state the exact extractor interface. Our local proof obligation concerns a hash-based binary-field PCS, so it must be discharged for that relation and its oracle model. [Natural Barriers to Quantum Extraction, 2026/2280](https://eprint.iacr.org/2026/2280), revised October 9, separates UC and standalone guarantees for particular PAKE and OT compilers. [Extract-Amplify-Measure, 2026/2370](https://eprint.iacr.org/2026/2370), October 6, offers stronger O2H transfers under specific one-sided or two-sided oracle access. The current constants remain unchanged pending an exact reduction using the required interfaces.

## Fixed permutation, preprocessing and query budgets

[Short Collisions Separate Sponge from Merkle-Damgard, 2026/2695](https://eprint.iacr.org/2026/2695), received October 30 and approved November 4, studies a salted classical model with separate preprocessing and online query budgets. Its three-block sponge attack uses inverse permutation queries and a later random initial capacity. The current task requires a production mapping that preserves our domain tags, canonical byte framing, initial state, digest lanes and feed-forward equations. The resource budget charges adversarial offline work as well as online work. Honest authenticated public preprocessing remains a separate setup condition.

[Quantum Time-Space Tradeoffs for Short Merkle-Damgard Collisions, 2026/2694](https://eprint.iacr.org/2026/2694), received October 30 and approved November 4, permits oracle-dependent quantum advice from an unbounded preprocessing phase. Its short-message MD bounds apply in that specified auxiliary-input model. An assessment with free oracle-dependent advice needs its own advice parameter and bound. The current sequential and gate-depth calculations use one total charged adversarial budget, including verification queries.

[Quantum Multi-Collision Lower Bounds for Arbitrary Bounded Types, 2026/2663](https://eprint.iacr.org/2026/2663), October 28, assumes a specified preimage multiplicity type of the queried function. A protocol's typed domain labels describe namespaces. They do not establish that multiplicity promise. The certificate retains its global collision term, charged once across all twenty-six events.

[Distinguishers for the Alternating Sponge and Duet, 2026/2430](https://eprint.iacr.org/2026/2430), October 9, uses the squeezing structure of two alternating permutations. Poseidon2b uses the source-pinned single permutation and its specified compression and duplex interfaces. The paper's output-shift and state-recovery constructions need a corresponding reachable operation before they can affect a production claim. The fixed-permutation task continues to require an event-specific bound or a concrete accepted production effect.

The current exact source check recomputes all 69 square minors of the external matrix and all 69 of its inverse. It checks S-box bijectivity, width four, exponent seven, eight full rounds and 58 partial rounds. The dimension-preserving CICO-2 collapse from [2026/1692](https://eprint.iacr.org/2026/1692), revised October 4, leaves zero tuple variables at this width while requiring two. Native cap verification compares the complete 32-byte digest. Both feed-forward lanes remain part of the relation. These are specific arithmetic and interface results under the published attack construction.

## Circuit diagnostics and authorization configuration

[Jacobian Diagnostics, 2026/1852](https://eprint.iacr.org/2026/1852), revised October 26, sharpens the distinction between tangent freedom, algebraic dependence and finite-field non-uniqueness. Its affine-line certificate checks both tangent equations and quadratic directional coefficients. The latter condition works in every characteristic and is useful for binary-field circuit diagnostics.

An independent GF(4) check illustrates both directions. For `x^2=0` the Jacobian admits every tangent direction, while only zero is a satisfying field value. Checking the quadratic directional coefficient rejects every nonzero proposed line. For `xy=0` at the origin, the direction `(1,0)` yields four genuine satisfying points. The regression test checks both examples. The general source-audit task requires a complete second satisfying witness or a certificate with all its hypotheses whenever it reports an underconstrained production relation.

Native replay confirms the selected V4 authorization ledger: 65 code queries, field-error numerator `701202001931` over `2^255`, 289 initial candidate pairs and 110 Owner algebraic roots. The current layout has 2,048 bank cells, 432 Libra cells, terminal offset 944 and two terminal pad groups containing ten cells. The honest proving entry uses `OsRng` and a fresh PCS commitment. Applying the hiding and repeated-authorization arguments requires independent OS-CSPRNG entropy for each honest attempt.

The observation interfaces examined in the earlier [SDitH and MQOM review](october-2026-attack-review.md#authorization-recovery-observations-and-fresh-randomness) remain distinct from our Merkle sibling hashes and algebraic openings. The current source check authenticates the relevant PCS source and records the changed authorization files. The grinding-free local ledger still assigns the final nonce zero fixed QROM security credit, consistently with the review of [Fiat-Shamir PoW, 2026/2326](https://eprint.iacr.org/2026/2326).

## Additional constructions screened

| Work | Relevance and treatment |
|---|---|
| [Polygero, 2026/2481](https://eprint.iacr.org/2026/2481), October 14 | Polynomial challenges give different proximity reductions. Adopting them requires changing the actual challenge relation and proving its composition. Current scalar challenge counts are preserved. |
| [ReedWeave, 2026/2147](https://eprint.iacr.org/2026/2147), revised October 29 | Interleaving and folding provide a different PCS and performance point. Its Goldilocks benchmarks use its own rate, field, proof and security target. |
| [BitZ, 2026/2141](https://eprint.iacr.org/2026/2141), revised October 4 | Binary commitments can represent cross-ring claims with an explicit linking reduction. The current certificate evaluates its existing binary-field relation and source geometry. |
| [Sublinear lookups, 2026/2581](https://eprint.iacr.org/2026/2581), October 21 | Reed-Muller proximity certifies polynomial preprocessing for a different lookup construction. Our sparse matrix preprocessing retains its own correspondence obligation. |
| [Projected Goppa codes, 2026/2606](https://eprint.iacr.org/2026/2606), October 22 | Supplies an alternative IOPP code family. Applying its theorem requires that family's domains and checks. |
| [Algebraic-geometry sumcheck, 2026/2494](https://eprint.iacr.org/2026/2494), October 15 | Changes the underlying multiplication code and protocol. Current algebraic root counts remain tied to the shipped verifier. |
| [Quantum state search with interactive advice, 2026/2535](https://eprint.iacr.org/2026/2535), revised October 25 | Bounds a Haar-state reflection search interface. Our authority-preimage and random-oracle events have different witnesses and query relations. |
| [LAMP, 2026/1571](https://eprint.iacr.org/2026/1571), November 5 follow-up | Proximity-based matrix multiplication is relevant background. The reviewed latest version is identified as November context. |

## Checks, publication and next mathematical work

The [exact certificate](../research/evidence/artifacts/2026-11-06/v21-soundness-mainnet.json), [native replay](../research/evidence/artifacts/2026-11-06/native-profile-replay.json), [source checks](../research/evidence/artifacts/2026-11-06/source-checks.json) and [October applicability checks](../research/evidence/artifacts/2026-11-06/october-applicability-checks.json) are public, deterministic artifacts. The Python suite checks source and bank substitutions, a missing Native class, changed PCS domains, modified metadata, authorization configuration, retained ancestry, every MAXDEPTH point, the exact sequential integer boundary and the new literature diagnostics. The native projection was compiled from the exact published production revision on the research host with one build worker. It performed metadata and ledger evaluation.

The [PR 23 review](https://git.parano1d.org/ignotusnemo/parano1d-soundness/pulls/23) independently authenticates the named historical retirement key bytes and narrows the general preprocessing question. Both PR 23 and PR 24 have published attributed review records with inconclusive classification and no bound-changing effects. Their contributions remain attached to their original contracts and source revisions.

The renewed active research contracts ask for four concrete advances: the RS-specific grouped agreement and source-restoration instantiation, the coupled native/ideal recursive compiler and recognizers, an event-specific fixed-Poseidon2b deviation analysis, and a justified coherent response-price lower charge. The general preprocessing correspondence and acceptance-path audits continue against the published v2.1 source. Each accepted result must identify its precise conditions and resulting certificate effect.

Reproduce the narrow checks without running a prover benchmark:

```sh
python3 research/tools/v21_certificate.py --json
python3 research/tools/october_2026_checks.py
python3 research/tools/v21_source_checks.py --production /path/to/parano1d
python3 -m unittest discover -s research/tools -p 'test_*.py' -v
```

The native projection additionally uses `research/tools/replay_v21_profile.py --production /path/to/parano1d`. Its first run compiles trusted production libraries. The complete monthly record preserves the earlier reports, contracts, claim namespaces and accepted ledger.
