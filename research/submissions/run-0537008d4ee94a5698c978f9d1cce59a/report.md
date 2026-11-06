# The closed-world ideal compiler cannot represent arithmetized recursive children

## Finding

**Challenges** the `v2-all-root-composition` condition, scoped to the ideal model. The certificate makes `MissRep` false with this step (production `noid_soundness/docs/category-one.md` lines 360-363): "In the closed-world typed ideal compiler, canonical nested artifacts are represented in the same database, so `MissRep` is false". That step cannot hold in any plain ideal-oracle (Q)ROM game whose History and wallet relations are the production relations. In v2.0.3 those relations check every parent History proof and every wallet capsule by running the fixed Poseidon2b duplex and Merkle walks as constraints. The result is a dilemma, and each branch breaks a premise of the target. This also rules out the step the October note proposes next ("an explicit coupled compiler and its progress property") if that compiler stays in the plain QROM. This is not a production forgery. It does not change the numerical frontier arithmetic. It moves the probability for every in-circuit-verified ancestor out of `epsilon_ideal` and into `Delta_P2b`.

## Pins and materials inspected

- Research workspace `parano1d-soundness` at `135733b04f123631ae38aaf0e5a8ec7e6be4adde`. Cloned with git; it matches the run archive with no file differences.
- Production and certificate at `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. I also read the integrated argument at `b159eb8c7c5d509ccbfc2102667769703272cd7c`.
- Contract `research/contracts/adaptive-all-root-qrom-v2.0.0.md`, task `AGENT_TASK.md`, `docs/october-2026-adaptive-all-root.md`, `docs/october-2026-correspondence-results.md`, `research/certificates/README.md`, `research/tools/all_root_model_check.py` and its receipts, the three earlier all-root reviews, and the channel message from Cipher (id 12).
- SHA-256 of the production files at 50d6dac:
  - `noid_soundness/docs/category-one.md` 2e8be995...22f4
  - `noid_soundness/docs/v2-retirement.md` 704137df...0ba3
  - `noid_soundness/src/v2.rs` 92b57853...21be2
  - `noid_recursive/src/acceptance/trace/r_pcs_region.rs` 8944b8a9...7618
  - `noid_recursive/src/region_sidecar.rs` 9f74ef80...1c93
  - `noid_recursive/src/acceptance/history_step/gated_recorder.rs` 436b194e...3725
  - `noid_recursive/src/acceptance/zk_auth_capsule_schedule.rs` 70d330be...0448101
  - `noid_recursive/src/acceptance/history_step/v2/banked/retirement_codec.rs` e96813d0...c47e
  - `noid_recursive/src/acceptance/history_step/v2/banked/decision.rs` 10b62a9f...8da

## Exact target

There is one stateful quantum adversary with total typed-oracle budget T and one measured compressed-oracle database D. `BadAll(D)` says that some represented accepting wallet, legacy History, v2 History or sparse root has a failed local extraction. `MissRep` says that a required noncertified child is absent from D. `BadTypedBind` covers collisions and domain confusion. The certificate claims two things:

- `BadState_v2 ⊆ BadAll ∪ MissRep ∪ BadTypedBind`.
- `MissRep` is false in the closed-world ideal compiler. This gives `Pr[BadState]_ideal <= epsilon_ideal(T) = min{1, 6T^2(kappa_* + (2T+1)/2^255) + 6T^3/2^256}`, with `kappa_*` the maximum over the 20-event inventory in `src/v2.rs`, and no multiplier for chain height, wallet count or root count.

The production bound then adds `Delta_P2b`, defined as an upper bound on `Pr[BadCompiler]_fixed - epsilon_ideal`.

## Source facts

1. **Parent History verification is arithmetized over fixed Poseidon2b.** `r_pcs_region.rs` (module doc) states that predecessor replay records every PCS leaf sponge and Merkle path as obligations. It discharges them on walk L-A, a combined duplex union with the `IVCPCSF_` capacity IV, and walk L-B, an ff-Merkle union with `IVCPCSN_`. The direction cells are pinned to transcript-bound query bits and the root to the FS-observed root wire. `region_sidecar.rs` describes one joint C1 transcript over three Link and six Block regions. `gated_recorder.rs` is transcript-identical to `FsChannelUnionRecorder`. The 50d6dac correspondence argument proves that native and trace channels agree because the `pow7`/MDS gadget computes the production permutation.
2. **Wallet authorization is arithmetized the same way.** `zk_auth_capsule_schedule.rs` contains the "production duplex schedules" (Owner m7, Main m8) that the selected-class recursive assembly consumes. `trace/zk_owner_verifier.rs` takes round challenges as "transcript-bound witness expressions".
3. **Only a few roots are verified natively in v2.** These are the v2 terminal (`banked/decision.rs::verify_terminal`), the legacy origin terminal and the two sparse retirement proofs (`retirement_codec.rs`: "The old terminal is replayed ... every live class has a pinned sparse evaluation proof"). Every other History ancestor, legacy or v2, and every wallet capsule is verified only inside a parent's arithmetic relation.
4. **The term is never defined.** The "closed-world typed ideal compiler" has no definition in any production or research document at these pins (searched for `closed-world`, `ideal compiler` and `relativ`).

## Theorem (dilemma)

Take any ideal game that gives every represented root its Fiat-Shamir coins from an ideal oracle H recorded in D, as the compressed-oracle lifting requires. Let c be an in-circuit-verified child: a parent History proof or a wallet capsule. Its acceptance inside the outer relation R is decided by `V_P2b`, the arithmetized verifier whose challenges are fixed Poseidon2b outputs. Then at least one of the following holds:

- **(A) Fixed child, production relation.** c is compiled with P2b, as in production. Then the child root is never an H-root, so `MissRep` holds for every accepted non-genesis terminal, including honest ones. An adversary that breaks `V_P2b` offline makes zero queries to the child's namespace. It produces a false child, and an outer proof that is honest and extracts correctly. It wins `BadState` with `BadAll` and `BadTypedBind` both false. So `MissRep` is not false, and `epsilon_ideal` does not bound `Pr[BadState]_ideal`.
- **(B) Ideal child, production relation.** c is compiled with H while R keeps the production `V_P2b` replay. The in-circuit challenge must then equal the H answer. Each re-derived C1 challenge matches only with probability `2^-255`, so recursive completeness fails.
- **(C) Programmed coupling.** H is programmed on the child namespace so that `H(child) = P2b(child)`. The child becomes represented and complete, but its coins are a fixed function of the public statement. The local theorem's premise fails: "each Fiat-Shamir squeeze is replaced by its corresponding independent verifier coin", with C1 coins uniform on 2^255 points. No compressed-oracle transition bound covers those entries.
- **(D) Relativized relation.** R is replaced by an oracle relation `R^H` in which the embedded verifier queries H. That is not the production R1CS relation that `kappa_H` and the 20-event inventory are computed for. A public-coin IOP over a fixed constraint system also cannot evaluate H. A model of this kind (for example the AROM of Chen, Chiesa, Gur, O'Connor and Spooner, [ePrint 2023/587](https://eprint.iacr.org/2023/587), whose abstract says ROM SNARK-based PCD "requires heuristically instantiating the oracle and using it in a non-black-box way") needs its own local theorems and lifting.

**Proof.** (B) and (C) are immediate: H is uniform and independent of the fixed function P2b, and programming fixes the answer support to a single point. For (A), the outer root is honestly generated, so its local extraction succeeds and returns the true witness. That witness contains a child that satisfies `V_P2b` but whose statement is false. No H entry in the child's namespace is required, so none is present, and therefore `MissRep` holds. No digest is shared, so `BadTypedBind` is false. `BadState` holds because the chain contains an invalid child. ∎

## Exact finite witness (passive, in `artifact.json`)

The setup is a challenge set Y of size 4 and a statement set X of size 4, with true statements {0}. The bad challenges are BAD = {1:2, 2:3, 3:1} and the fixed function is P = {0:1, 1:2, 2:0, 3:0}. A proof verifies when x is true or c = BAD[x], so the local density is 1/4. The outer system is perfectly sound. Enumerating all 256 child-namespace assignments of H gives:

- **(A)** For statement 1: `Pr[BadState]=1`, `Pr[MissRep]=1`, `Pr[BadAll]=0`, `Pr[BadTypedBind]=0`, with 0 child-namespace queries.
- **(B)** Honest recursive acceptance is exactly 1/4, the toy analogue of 2^-255.
- **(C)** Programmed child answers have support size 1 and `Pr[BadAll_child]=1`, against a claimed density of 1/4.

Anyone can recompute these by hand from the definitions above. The October check `fixed_replay_does_not_imply_same_database_closure` only shows that closure is *not implied*. This result shows that, for the production relation, no plain-QROM coupling can make closure true with completeness and uniform child coins together.

## Consequence for the certificate

- In the ideal game, `epsilon_ideal` covers only the natively verified roots of fact 3. The claims of "no chain-height, wallet-count or represented-root multiplier" and "every represented root from genesis" do not cover the in-circuit ancestors in the ideal model.
- Category-one already routes production `MissRep` into `Delta_P2b`. Under this result `Delta_P2b` must carry the arbitrary-depth knowledge soundness of the fixed-hash recursion, with straight-line extraction for every ancestor and wallet. It is not a small deviation between nearly equal games.
- The fixed experiment does not define a measured D. Under the literal reading (no database), `Pr[MissRep]_fixed = 1` for an honest non-genesis terminal. That forces `Delta_P2b >= 1 - epsilon_ideal ≈ 0.9506`, which exceeds the v2 headroom 1/2 - 0.04937 ≈ 0.4506 and the legacy headrooms 0.3125 and 0.4507. The condition is meaningful only after a fixed-world D, meaning a recording or extractor, is specified. The certificate does not specify one.

## Further reproducibility gap

`docs/october-2026-adaptive-all-root.md` and `research/evidence/artifacts/2026-10-08-all-root/reproduction.json` cite production `noid_soundness/docs/adaptive-all-root-v2.md` (SHA-256 4bcafcd7...5b97, 14769 bytes) at analysis commit `5daad03c7f1049ae28ab10ae1201b00d1e4e1887`, branch `research/adaptive-all-root-v2`. The production remote does not serve it. `git fetch origin 5daad03c...` returns "upload-pack: not our ref". No branch, tag or `refs/pull/*` head contains a file named `adaptive-all-root*`. The note states that the written namespace proof, not the finite test, carries its lemma. As published, that proof cannot be replayed.

## Axiom inventory

- Uniformity and independence of ideal-oracle answers.
- The production facts 1-3, read from source and not executed.
- The local-theorem premise as stated in category-one.

No proof assistant is used and no goals are admitted. No contributor code was executed. The finite witness came from my own stdlib-only script, kept outside both repositories; only its passive output is submitted.

## Reproduction

1. Clone both repositories at the pins above and verify `git rev-parse HEAD` for each.
2. Run `git show 50d6dac:<path> | sha256sum` for each listed file.
3. Run `sed -n 1,46p noid_recursive/src/acceptance/trace/r_pcs_region.rs`, `sed -n 1,20p noid_recursive/src/region_sidecar.rs` and `sed -n 1,14p noid_recursive/src/acceptance/zk_auth_capsule_schedule.rs`.
4. Run `sed -n 355,368p noid_soundness/docs/category-one.md`.
5. Run `git fetch origin 5daad03c7f1049ae28ab10ae1201b00d1e4e1887`, then `git ls-remote origin`.
6. Recompute the 256-case enumeration from the toy definition.

## Limitations

- No attack on Poseidon2b or production forgery is shown. Branch (A) needs `V_P2b` to be breakable offline. That is possible in the toy. In production it is exactly what `Delta_P2b` must exclude.
- An AROM-style or other relativized model might restore an all-root theorem. That would need new local bounds and a new lifting, not the current inventory.
- The numerical values 173.3897612554174 and about 0.04937 are not recomputed here. Their arithmetic is not disputed. What changes is the scope of what they bound.
