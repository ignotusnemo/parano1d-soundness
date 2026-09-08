# Independent review: adaptive all-root QROM theorem

## Finding

**Inconclusive.** The pinned certificate faithfully computes the stated local and sequential bounds, and the pinned production implementation enforces the deterministic recursive transition once all nested artifacts are available. I did not find a concrete forgery or counterexample. However, the exact adaptive all-root conclusion is not independently closed by the pinned materials because its ideal compiler and database-closure lemmas are stated but not formalized or tested.

## Exact target

The target is the from-genesis invalid-terminal-State game in `docs/category-one.md` at certificate commit `e45cfefd0632ed48d9f2f1975bf5174b5356a37c`, with production correspondence at Parano1d commit `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`. One stateful quantum adversary has one total typed-oracle query cap `T`. A single measured compressed-oracle database `D` represents every typed, statement-keyed wallet and History root. `BadAll(D)` is the existential event that some represented accepting root has no valid deterministic local extraction. `MissRep` is absence of a required noncertified child, and `BadTypedBind` covers collision, ambiguous encoding, or domain confusion. The claimed structural inclusion is

`BadState ⊆ BadAll ∪ MissRep ∪ BadTypedBind`.

The claimed sequential ideal bound is

`epsilon(T) = min(1, 6*T^2*(kappa_* + (2*T+1)/2^255) + 6*T^3/2^256)`,

where `kappa_* = max(kappa_W, kappa_H(861824))` and `kappa_W`, `kappa_H` are equations (3)--(9) of the pinned theorem. The claim is that no factor for chain height, wallet count, or represented-root count is added.

## Checked evidence

I inspected the authenticated workspace archive, the active v1.1.0 contract and task, `docs/category-one.md`, `docs/parameter-provenance.md`, `model/production.toml`, `src/local.rs`, `src/qrom.rs`, `src/resource.rs`, `src/parameters.rs`, their tests, and the passive verifier tests. The local calculator tests pin the W65/H133 profile, the two History classes, 255-bit challenge support, 256-bit digest width, multiplicity 861824, and the displayed query boundary. They do not model `BadAll`, typed database flips, `MissRep`, or recursive representation closure.

I independently checked the production checkout at immutable commit `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`, including `verify_history_step_terminal`, `decode_verify_history_step_terminal`, `ChainAccumulator::advance`, recursive suffix/reorg paths, snapshot finalization, and the trusted local-prover bridge. These checks support deterministic parent/height/genesis binding after extraction; they do not define an ideal compressed-oracle representation map.

The intended proof route is plausible conditionally: fixed-instance extraction supplies a local generalized round-by-round error; statement-keyed compressed-oracle lifting can take a maximum over keys; and post-measurement height induction can traverse a finite represented graph without probability union over height. But the following exact obligations remain unproved in this pin:

1. **Statement exclusivity.** Outside `BadTypedBind`, every insertion `D+[x→y]` must affect at most one typed statement's acceptance/extractor state, in both directions of the instability flip. The cited compressed-oracle transition lemmas bound database properties once such a property sequence is supplied; they do not construct the recursive compiler's typed namespace.
2. **Recursive representation closure.** Every parent proof, wallet proof, and joint-sidecar obligation returned by a valid outer extractor must be a represented accepting root in the same measured `D`, so `MissRep` is identically false in the closed-world ideal game. The certificate asserts this but provides no encoding, closure lemma, or executable check.
3. **Embedded-verifier accounting.** Parent Fiat–Shamir/recursive verification must query the same typed ideal oracle cells and be charged to the one total budget. Production replays use the fixed Poseidon2b duplex; no corresponding ideal-oracle representation or query-accounting construction is supplied.

Without (1), disjoint local bad properties can share one oracle insertion and the maximum local error is not enough for their union. Without (2), deterministic traversal can reach an opaque parent not covered by `BadAll`; then the claimed `MissRep=false` step is unavailable. These are specific proof obligations, not a counterexample against the theorem.

## Axiom inventory

Imported results are the fixed-instance BCS/compressed-oracle extraction theorem, the adaptive statement-keyed lifting theorem, the local wallet/History list-correlated agreement analysis, and the deterministic production transition correspondence. Additional assumptions needed for the published all-root specialization are a collision-free typed semantic encoding, statement-exclusive flips, closed-world nested-artifact representation, and common accounting of embedded verifier queries. No proof assistant, admitted-goal artifact, or machine-checked all-root certificate is present.

## Reproduction

1. Fetch the authenticated run archive and verify its path-safe tar listing.
2. Check out certificate revision `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` and production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`.
3. In the certificate workspace run `cargo test --locked --release`; inspect `src/qrom.rs::ideal_breakdown`, `src/local.rs`, and `src/resource.rs`.
4. Run `rg -n 'BadAll|MissRep|BadTypedBind'` over the certificate workspace and `rg -n 'verify_history_step_terminal|ChainAccumulator::advance|begin_preverified_recursive_suffix|apply_verified_recursive_suffix_block'` over the production checkout. The first search finds theorem prose but no executable ideal-compiler model; the second finds the deterministic production paths described above.
5. Read the immutable primary sources: [FRACTAL ePrint 2019/1076](https://eprint.iacr.org/2019/1076.pdf) (Theorem 11.5 is explicitly for constant-depth compliance predicates) and [On the Compressed-Oracle Technique ePrint 2020/1305](https://eprint.iacr.org/2020/1305.pdf) (Theorem 5.7 requires a supplied sequence of database properties and transition capacities).

## Limitations

This is a source-pinned static cryptographic review. It does not rederive every local list-decoding bound, prove the theorem false, or claim a production attack. The correct finding is therefore `inconclusive`, with no claim or frontier effect until the three compiler obligations are formalized and independently reviewed.
