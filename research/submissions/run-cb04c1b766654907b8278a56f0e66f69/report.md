# A 128 logical gate-depth universal lower bound for the scalar response

## Result and exact game

This report proves a small but unconditional lower frontier for the exact pinned scalar response relation. Let `P` be the production permutation over `GF(2^128)^4` at production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`: width four, rate two, exponent seven, eight full rounds, 58 partial rounds, the published full and partial matrices, and the published round constants. Let

`f(s) = pi_0(P(s)) in GF(2^128)`.

The scalar coherent response oracle has fixed named query and response registers and implements

`U_f: |s>|z>|0^a> -> |s>|z xor f(s)>|garbage(s,z)>`,

with the required scalar response exact on all computational-basis inputs. Allowing garbage only weakens the lower-bound assumptions; a clean oracle is the special case in which the ancillas return to zero. In the declared logical basis of CNOT, one-qubit Clifford and T gates, every exact implementation has at least 128 logical gates and logical depth at least one. Therefore

`coherent-response.minimum-gate-depth-lower >= 128 logical gate-depth`.

This raises only the previously absent universal lower frontier. It is far below the published `200343274560` gate-depth premise and does not prove that premise.

## Proof

First, `P` is a permutation. Addition of a round constant is a translation. The exponent map is bijective because `gcd(7, 2^128 - 1) = 1`, including zero. Independent Gaussian elimination using the pinned recursive tower-field multiplication gives determinant `0x40` for `MDS_FULL` and `0x2064` for `MDS_PARTIAL`; both are nonzero. Hence the initial matrix and every round operation are bijective, so their composition `P` is bijective.

It follows that `f = pi_0 o P` is surjective onto `GF(2^128)`: for any desired lane `u`, choose the four-lane permutation output `(u,0,0,0)` and take its unique preimage. Consequently each of the 128 coordinate Boolean functions `f_j` is nonzero. For every response bit `j`, there is therefore an input `s_j` for which the exact oracle maps the initially zero response bit `z_j` to one.

Now count target touches. A response qubit that is never the target of a CNOT and never receives a non-diagonal one-qubit operation retains its computational-basis value. A T or diagonal Clifford changes only phase; using that response qubit merely as a CNOT control also leaves its basis value unchanged. Thus every one of the 128 live response coordinates must be actively changed by at least one logical gate. In this frozen basis a CNOT actively changes only its one target, while a one-qubit gate acts on only one response qubit. No single logical gate can cover two required response-coordinate changes. Therefore the logical gate count is at least 128. A nonempty circuit has depth at least one, giving gate-depth at least `128 * 1 = 128`.

The argument grants all-to-all connectivity and free initialized ancillas. Restricted connectivity, explicit routing, fan-out, constants, linear layers and uncomputation can only add gates or depth. Input-dependent garbage does not remove the obligation to produce all exact response bits. Mid-circuit measurement of the query or response would not implement the required coherent unitary on superpositions; measurement of ancillary data with feed-forward still requires a counted correction gate for each changed response bit and does not evade the target-touch count. No free wire relabeling is allowed because the contract requires fixed inputs/outputs and explicit routing.

## Production correspondence

The pinned production source defines `STATE_SIZE=4`, `SBOX_EXPONENT=7`, `F_ROUNDS=8` and `P_ROUNDS=58` in `noid_poseidon2b/src/native/permutation.rs`. `permute_flat_u128` applies the initial full matrix and then the exact 66-round schedule. `Poseidon2bChannel::squeeze` in `noid_poseidon2b/src/channel.rs` returns one `Block128`, establishing the 128-bit scalar interface; the wide channel and query-vector interfaces are no smaller. The certificate's `src/resource.rs::poseidon2b_response_cost` assigns one permutation to the scalar response and reproduces the published construction figures: 17,648,280 logical gates, depth 11,352 and gate-depth 200,343,274,560. Wallet query and History query responses use four and twelve sequential permutations respectively. The theorem above is about the complete scalar output relation rather than an isolated multiplier component.

The public channel later reported a checked, separate accounting issue: the 49,023/43 multiplier figures omit modular reduction, in addition to acknowledged omitted linear work. That information changes the interpretation of the published number as a complete upper construction, but it does not affect this lower-bound proof, which uses no multiplier accounting.

## Reproduction and evidence

The authenticated workspace archive was fetched as required for run workspace revision `04f2a47bdd5f3b51286ce8e7cb613fca169dc0b6`; its observed SHA-256 is `ef6a7f75bd76b83d43e93caf7d5f796ac13d97983f6bf5470d8fe0d9c33d9bf9`. The certificate and production repositories were checked out detached at `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` and `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`. The workspace copies of `src/resource.rs` and `docs/category-one.md` are byte-identical to the certificate pin.

Reproduction commands used were `git rev-parse HEAD` in each pinned repository, `sha256sum workspace.tar.gz`, `cmp -s` on the two certificate files above, `cargo test --release --locked` in the certificate repository, `cargo test -p noid_poseidon2b --release --locked` in the production repository, and `cargo run --release --locked --quiet` in the certificate repository. The certificate ran 29 passing tests; the production Poseidon crate ran 56 unit tests and three compile-fail doc tests. The certificate executable printed the exact published response counts. An independent recursive-tower elimination using the field recursion and base polynomial pinned in `src/poseidon2b_cryptanalysis.rs` produced the two determinants above, and direct integer evaluation produced the stated gcd.

## Limitations and conclusion

The bound 128 is deliberately architecture-favorable and weak. It does not count the internal state update, nonlinear work, linear layers, constants, routing or cleanup, and it does not claim a cheaper construction. It assumes the contract's standard fixed-register XOR response semantics; permitting a free change of the external interface or free output-wire relabeling would define a different resource model. It also does not resolve the separate omitted-reduction accounting finding.

Within the exact scalar relation and declared gate basis, however, the target-touch argument is universal over all circuit organizations, ancilla strategies and implementations. The appropriate finding is `supports` with the sole frontier effect `coherent-response.minimum-gate-depth-lower = 128`.
