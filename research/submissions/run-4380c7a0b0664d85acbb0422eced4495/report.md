# Inconclusive review of the adaptive all-root theorem

## Claimed effect

Finding: inconclusive. This review does not change `adaptive-all-root-qrom`. It isolates a proof obligation that must be discharged before the published no-chain-height bound can be treated as independently derived.

## Frozen scope inspected

I inspected the authenticated workspace archive for run `4380c7a0-b066-4d85-acbb-0422eced4495` at source revision `bc66deba28007832025093d47bd6f6a4bb89c7fd` (observed archive SHA-256 `5cbc8361f1e05c6e836a3858e6b1481732eb7e45506b634ce6aad1ebb7aff8a5`). I then inspected immutable archives for certificate revision `c3ea3342fbe27111c84046613010f14f13b917c6` (observed SHA-256 `ac2bb9c7a6ad8775aebae01fe8a9109a39ba3ef4b169b514934aafdd86b45bf8`) and production revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` (observed SHA-256 `a11a27c34b21ae67abcb5186bf933e637e3270f8f96728b64a697a322ca970eb`). The theorem document, model, and Rust calculator files in the workspace are byte-identical to the certificate pin.

Reviewed materials include the all-root contract and task, `docs/category-one.md`, `docs/parameter-provenance.md`, `model/production.toml`, `src/local.rs`, `src/qrom.rs`, `src/resource.rs`, `src/parameters.rs`, their inline tests, the passive verifier tests, and production `noid_recursive` HistoryStep relation, terminal, wire, accumulator, transcript challenger, and acceptance code. I also checked CMS Proposition 8.14 and Lemmas 5.7 and 5.13 in ePrint 2019/834, FRACTAL Lemma 10.9 and Theorem 11.5 in ePrint 2019/1076, and the cited compressed-oracle collision result in ePrint 2020/1305. No third-party instructions or contributor code were executed.

## Exact target statement

Let `D` be the single measured typed compressed-oracle database. `BadAll(D)` means that some represented accepting wallet or History root has no valid output from its deterministic local extractor. `MissRep` means that deterministic ancestry traversal requires a noncertified child absent from `D`. `BadTypedBind` covers collision, ambiguous encoding, or domain confusion that changes the typed semantic graph. The structural claim is

`BadState` subset of `BadAll` union `MissRep` union `BadTypedBind`.

For the W65/H133 profile, define

`kappa_W = max((15/64)^65, 29163918888/2^255)`,

`kappa_* = max(kappa_W, kappa_H(861824))`,

where `kappa_H` is exactly equations (5) through (9) of the pinned theorem. For one stateful adversary with total typed-oracle query cap `T`, the claimed sequential ideal bound is

`epsilon_ideal(T) = min(1, 6 T^2 (kappa_* + (2T+1)/2^255) + 6 T^3/2^256)`.

The claimed strengthening over ordinary recursive composition is that neither this probability nor its local term is multiplied by chain height, wallet count, or represented-root count. In the declared closed-world ideal compiler, `MissRep` is asserted false. Fixed Poseidon2b production requires the separate event-specific `Delta_P2b` premise and is not part of the unconditional ideal claim.

## Conditional derivation and the unresolved obligation

There is a valid proof route if two compiler lemmas are assumed. First, CMS Proposition 8.14 bounds the instability of verifier acceptance with failed extraction for all hash-chain endpoints of one BCS instance by a local round-by-round knowledge error plus a finite transcript term. Second, FRACTAL Lemma 10.9 takes a maximum across adaptively selected statement-keyed instances, rather than a union sum, because its concrete namespace construction ensures that one database insertion affects only one keyed instance except on a counted collision event. CMS Lemma 5.7 then gives the `6T^2` quantum lifting factor. After measurement, a deterministic induction on History height proves the semantic implication if every canonical parent, wallet, and sidecar extracted at one root is itself represented and uniquely typed in the same `D`.

The pinned certificate states these two required compiler facts but does not define a database encoding or prove them for the exact recursive compiler:

1. Statement exclusivity: conditioned outside `BadTypedBind`, every possible insertion `D + [x -> y]` must affect the acceptance or extractor state of at most one typed statement, including both directions of the instability flip.
2. Recursive representation closure: every parent History proof, wallet proof, and joint-sidecar obligation returned by a valid local extractor must determine a represented accepting root in the same measured `D`, so that `MissRep` is identically false rather than another probabilistic event.
3. Oracle accounting for embedded verification: the in-circuit replay of a parent Fiat-Shamir verifier must map to those same typed ideal-oracle entries. The production source implements this replay with the fixed Poseidon2b duplex; it does not itself define the corresponding ideal compressed-oracle representation map.

These are necessary, not cosmetic. Without statement exclusivity, one oracle cell can affect several statement properties whose bad-output sets are disjoint; each local property can have instability `kappa`, while their union has instability proportional to the number of properties. Without recursive representation closure, an outer accepting root can expose an opaque parent artifact not represented in `D`; then `BadAll(D)` does not cover the parent and `MissRep` is not false. The intended typed compiler may exclude both countermodels, but the exclusion is the missing lemma.

The primary citations do not close this gap as written. CMS Proposition 8.14 treats the concrete BCS hash-chain property for one instance. FRACTAL Lemma 10.9 proves adaptive statement keying for its specified namespace grammar. FRACTAL Theorem 11.5 addresses constant-depth PCD and its recursive extractor analysis incurs depth or node-dependent loss; it is not the published reachability-free, arbitrary-height all-root lemma. A new specialization can be correct, but its statement and proof are not present in the pinned materials.

The Rust calculator confirms only the arithmetic conditional on that lemma. `src/qrom.rs::ideal_breakdown` evaluates the boxed formula, and its tests pin the numerical boundary. The local and parameter tests pin W65/H133, 255-bit challenge support, 256-bit digests, two History classes, and local terms. No test or executable artifact models `BadAll`, `MissRep`, typed database flips, or recursive representation closure.

## Production correspondence checked

The production source does support the intended deterministic graph after successful extraction. `HistoryStepProof` embeds the parent envelope; `prepare_history_step_recursive` binds the current start accumulator to the parent public IO; `ParentClassSelectorTrace` authenticates the parent class; base assembly pins the genesis accumulator; terminal metadata enforces base exactly at height one; and `verify_history_step_terminal` replays the proof before returning a consuming authority. `ChainAccumulator::advance` enforces exact height, semantic parent, block link, and State boundary. These facts justify the post-measurement height induction, but they do not prove the missing ideal-database closure.

## Axiom inventory

Imported mathematical results: CMS compressed-oracle lifting and fixed-instance BCS extraction instability; the FRACTAL adaptive namespace lemma; the pinned local wallet and History generalized round-by-round theorem; and the deterministic production transition correspondence.

Additional assumptions required by the published conclusion: an exact typed ideal-compiler syntax; collision-free semantic decoding outside `BadTypedBind`; statement-exclusive one-entry flips; closed-world nested-artifact representation; and accounting of embedded parent-verifier oracle calls in the same total budget. The last three are not proved in the pin.

No proof assistant, external proof artifact, trusted axioms beyond the cited paper results, admitted goals, or machine-readable counterexample are claimed.

## Reproduction

Fetch the authenticated run workspace from the run workspace URL with the Bearer token supplied out of band, then use `sha256sum` and `tar -tzf` to check the first digest above and safe archive paths. Fetch the immutable pins with `curl -fsSL https://github.com/ignotusnemo/parano1d-soundness/archive/c3ea3342fbe27111c84046613010f14f13b917c6.tar.gz -o certificate.tar.gz` and `curl -fsSL https://github.com/ignotusnemo/parano1d/archive/fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0.tar.gz -o production.tar.gz`; verify the observed digests above. Use `cmp -s` on `docs/category-one.md`, `docs/parameter-provenance.md`, `model/production.toml`, `src/local.rs`, `src/qrom.rs`, `src/resource.rs`, and `src/parameters.rs` between the workspace and certificate pin. Use `rg` for `BadAll|MissRep|BadTypedBind`, `prepare_history_step_recursive`, `verify_history_step_terminal`, and `ParentClassSelectorTrace` to reproduce the static trace. The paper sections are reproducible from `https://eprint.iacr.org/2019/834.pdf`, `https://eprint.iacr.org/2019/1076.pdf`, and `https://eprint.iacr.org/2020/1305.pdf`.

## Limitations

This is a static source and primary-proof review. It does not independently rederive the large local History list-decoding theorem, provide a formal ideal compiler, exhibit a production forgery, or prove the all-root claim false. The identified gap blocks a supporting conclusion but is not a concrete counterexample; therefore the proper result is inconclusive.
