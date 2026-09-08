## Inconclusive review

### Exact target

For one stateful quantum adversary with total typed-oracle cap T and one measured database D, the target claims BadAll(D) covers all adaptively selected represented wallet and History roots without a chain-height, wallet-count, or represented-root multiplier. Its structural reduction is BadState subseteq BadAll union MissRep union BadTypedBind and the stated ideal bound is min(1, 6T^2(kappa_*+(2T+1)/2^255)+6T^3/2^256).

### Checked result

I inspected the authenticated workspace at source revision 04f2a47bdd5f3b51286ce8e7cb613fca169dc0b6, including the v1.1.0 contract/task, docs/category-one.md, src/qrom.rs, src/local.rs, src/parameters.rs, model/production.toml, docs/parameter-provenance.md, and research tests. The qrom calculator implements a numeric ideal_breakdown over local_rbr and has tests for the response permutation count and numerical boundary. It contains no typed database, namespace, root, extractor, or recursive-representation model. Searching the pinned workspace finds BadAll, MissRep, and BadTypedBind only in theorem prose, contracts, and a prior review, not in an executable/formal compiler proof.

The no-multiplier conclusion therefore remains conditional on three unstated compiler lemmas: (1) outside BadTypedBind, a one-cell database insertion changes extractor or acceptance state for at most one typed statement, in either flip direction; (2) every canonical parent, wallet, and sidecar emitted by extraction is a represented accepting root in the same D, so MissRep is false; and (3) embedded parent-verifier oracle calls map to and are charged against that same total oracle budget. Without (1), one cell can affect many disjoint statement events; without (2), an outer root can expose an unrepresented child outside BadAll. The provenance map names a deterministic post-measurement State-transition path but does not define the ideal-database encoding or prove these lemmas.

### Axioms, reproduction, limitations

The conditional route assumes the cited compressed-oracle lifting, local W65/H133 bounds, typed adaptive composition, collision-free decoding, statement exclusivity, representation closure, and unified accounting. Reproduce by inspecting category-one.md lines 310--395, src/qrom.rs lines 19--169, the provenance map lines 75--84, and searching for BadAll|MissRep|BadTypedBind. I found no production forgery or concrete counterexample and do not claim a fixed-root result. An intended compiler may establish the missing lemmas, but it is not present in the inspected pin; finding: inconclusive.
