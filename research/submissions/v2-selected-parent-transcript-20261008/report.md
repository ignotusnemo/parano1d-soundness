# V2 selected parent and transcript correspondence

The frozen target is `v2-compiler-correspondence`, production and integrated certificate commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. This supporting result establishes the selected-parent transcript and exact-lane preservation obligation in the current bank. It does not establish general concrete Fiat-Shamir security or discharge the full adaptive all-root compiler.

## Falsifiable claim

For an accepted current-bank relation witness, the authenticated nonbase class bit selects exactly one predecessor verifier arm. Its native rejection equations, framed transcript inputs, recorded challenge cells and PCS leaves/paths/roots refer to that same predecessor. The other class carries its complete matrix claim unchanged. Contract data cannot substitute a new bank, proving relation, class shape or verifier key. A satisfying witness that detaches the selected recording from that arm or resets the inactive lane would refute this claim.

## Assumptions and source

The adversary chooses peer proof bytes, previous proofs, contract programs and public data. The verifier executable, class-fixed authenticated matrices, release bank and exact finite-field/basis implementations are trusted. Commitment and digest binding and the existing sidecar/local extraction conditions remain explicit. Direct inline gadget equality is deterministic for a satisfying constraint assignment; validity of the recorded deferred walk is conditional on its authenticated sidecar reduction. No unsuccessful test mutation is used as a cryptographic probability bound.

## Transcript equivalence lemma

Consider a finite sequence of legal operations of the production C1 channel. An operation header has `lo = op | kind << 8` and `hi = length`. The allowed op/kind pairs specify the number and kind of following lanes. Byte operations include their original byte length, so zero padding cannot make different byte strings share an encoding. Scalar and vector operations, base and extension values, domains and labels have distinct headers. Lengths are bounded by the production transport and geometry. Parsing the sequence from its first header therefore recovers exactly one operation sequence. This establishes encoding injectivity before hashing, not collision resistance of the sponge.

For the direct native/trace pair, use the invariant that the evaluated trace state, buffered lane, pending squeeze lane and permutation count equal the native channel's values after every operation. Initialization uses the same C1 IV and framed domain. An absorb discards the same pending lane and either buffers one lane or adds the same pair and permutes. An odd flush adds the same pad lane. A squeeze either returns the same pending lane or returns state lane zero, saves lane one and permutes. Both wide draws apply the same `F256::from_raw_challenge_lanes` map. Induction proves equality of every challenge and final state, conditional only on exact arithmetic and correctness of the permutation gadget.

The permutation gadget also has a deterministic arithmetic proof. The constant-one wire is pinned by the production class specification and lincheck. A multiplication allocation then constrains its output to the product of its two input expressions. The four allocations in `pow7` therefore force `x2=x*x`, `x4=x2*x2`, `x3=x2*x` and `x7=x4*x3`, hence exactly `x7=x^7`. Its affine MDS expressions and round constants import the same production tables, converted by the same field-basis isomorphism. Starting with the initial full MDS layer, induction over four full, fifty-eight partial and four full rounds gives the same mathematical permutation for every input, not only sampled inputs. This argument assumes the exact field operations and basis conversion underlying both implementations; it is not a formal verification of every hardware kernel.

For the wide challenge, the native map and its trace both compute `(lo, y^2+y+tau)`. The linear map `y -> y^2+y` over `GF(2^128)` has kernel `{0,1}` and image the trace-zero subspace. Since tau has trace one, uniform y maps two-to-one onto the trace-one affine subspace of size `2^127`. Together with the independent uniform 128-bit lo lane, the challenge is uniform on exactly `2^255` points. The trace enforces the square by a multiplication constraint and adds the same tau. This proves the stated support and native/trace equality under uniform raw lanes; it does not assert that a fixed public sponge is an ideal random oracle.

The native implementation is [FsLaneChallenger](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/challenger.rs), and the direct trace is [FsChannelTrace](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/field_circuit.rs). The selected-parent path uses [BaseSelectableParentRecorder](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/gated_recorder.rs): its numerical state follows the same recurrence, but challenge wires are initially allocated rather than hashed inline. Their authority comes from the recorded duplex walk and source bindings, not from their initial witness values. [Parent-region finalization](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/trace/r_pcs_region.rs) binds the selected recorded data/challenge cells and the PCS leaves, directions and roots to that walk. Under the existing sidecar extraction condition, the selected recording has the same transcript as native replay. The recorder alone grants no such guarantee.


## Selected parent and exact carry lemma

Let b be the current base flag and s the authenticated predecessor-class bit. The fixed relation constrains `b(b+1)=0` and `s(s+1)=0` over a field, so both belong to `{0,1}`. In characteristic two the nonbase gate is `g=1+b`, the small selector is `1+s`, and the large selector is s. The two arm gates are:

```text
g_small = (1 + b)(1 + s)
g_large = (1 + b)s
```

If b is zero, exactly one arm gate is one. If b is one, both are zero. For every rejection equation E, [scoped gating](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/trace/mod.rs) imposes `g_arm * E = 0`. Thus the selected nonbase arm retains every native rejection equation; disabling the unselected arm cannot disable the selected one. Nested source-binding gates multiply to the same authenticated selected-arm gate.

For each lane coordinate the [fixed assembly](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/assembly.rs) imposes

```text
out = previous + g_arm * (folded + previous).
```

For an active arm this is `out=folded`; for an inactive arm it is `out=previous`. The same rule changes the active lane's liveness bit to one and carries inactive liveness unchanged. At the base boundary every matrix lane is constrained to zero. Hence changing block class cannot reset a previously live lane, and the base arm cannot import an unchecked v2 matrix claim.

The ordered bank, matrix/post-commit identities and sealed origin prefix are copied from the same predecessor IO. The selected predecessor's semantic block ID and all ten start-accumulator lanes are bound to the current block's parent and start State; all end lanes are bound to the current public IO. On the base arm, those start lanes instead equal the independently verified legacy origin. Native [bank parsing](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/bank.rs) requires the pinned bank, both matrix/post identities, exact IO length, canonical booleans and dead lanes, and base status exactly at activation height. Together these constraints exclude an alternative parent-class route or an asserted origin as acceptance authority, under the local relation and binding conditions.

The [native matrix fold](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_ivc_core/src/matrix_claim/c1.rs) and [its trace twin](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/trace/matrix_fold.rs) absorb the same complete fresh/incoming claims, perform the same two degree-two sumcheck phases and return the same point/value. Write `E_f` and `E_a` for the errors in the fresh and incoming evaluations. Before the first phase, an incorrect combined target has error `E_f + gamma * live * E_a`. If either required evaluation is false, this is a nonzero polynomial of degree at most one in gamma. The analogous second-phase combination uses delta after both intermediate values are observed. Outside those affine exceptions and the sumcheck exceptions, correctness of the authenticated outgoing evaluation propagates backwards to all live inputs. This is why copying the inactive lane and authenticating both final lanes are necessary; native replay without final matrix closure would be insufficient.


## Fixed relation lemma

The [bank identity](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked/bank.rs) commits to the ordered configuration, IO specification, both matrix identities and PCS shapes, both block verifier-key digests, the parent verifier-key digest and both post-commit identities. [Runtime construction](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/history_step/v2/banked.rs) checks its parts against that bank, and every matrix load checks exact shape and structural digest. Native terminal replay binds matrix identity and commitment, complete public IO, then the post-commit sidecar identity before zerocheck, lincheck and PCS verification. The trace uses the same order and sources.

The sixteen-instruction [integer program](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_tx/src/experimental_object/integer_program.rs) is witness data interpreted by [a fixed constraint gadget](https://github.com/ignotusnemo/parano1d/blob/50d6dac5a37b9f1be425b5e6cd823de48f843b50/noid_recursive/src/acceptance/trace/integer_program.rs). Instructions select among fixed, constrained operand/opcode/predicate tensors; they do not supply a verifier key, transcript implementation, class shape or new proving relation. Capacity limits and the fork schedule are bank configuration, not witness choices. This excludes relation substitution through contract data. It does not establish that every possible program inside that fixed relation is immune to concrete hash self-reference. That stronger conclusion belongs to the fixed-hash instantiation condition.


## Reproduction

Obtain the complete frozen production checkout. Compare `FsLaneChallenger` with `FsChannelTrace`, then follow `BaseSelectableParentRecorder` through `finalize_history_step_parent_region` and `prepare_assembly`. Read native and trace matrix folds in the order listed in the artifact. The integrated source argument is committed as `b159eb8c7c5d509ccbfc2102667769703272cd7c` at `noid_soundness/docs/v2-correspondence-2026-10.md`; the report above includes its relevant proof rather than relying on a prose task summary.

Four existing source-correspondence regressions passed: C1 native/trace wide operations, raw wide-lane bindings in layout/union recorders, rejection of layout drift, and the permutation native/trace comparison. They were replayed using the previously compiled audit binary, SHA-256 `661525884cef4c836a46b2aa5cb55747eac0f02e5eef22a6f64bcb4dae523f66`, from audit commit `9c8136e4482cbba2a6fd5f469ac668c789ea1e01`; subsequent production edits contain documentation/comments only. To rebuild these regressions independently, use `cargo test --release --locked -p noid-ivc-core TEST_NAME -- --exact --test-threads=1` with the fully qualified names in `artifact.json`. Their total observed runtime was 52 ms; no performance claim follows.

## Agent channel and remaining obligations

The current compiler task channel has no messages. Cipher's accepted all-root review, public channel message 12 and canonical research PR 10, identifies statement-exclusive database transitions, same-database representation closure and embedded-verifier query accounting. I checked the cited Fractal text: Theorem 11.5 is for constant-depth compliant transcripts and its Section 2.5 assumes secure concrete hash instantiation. These observations constrain this result. The proof establishes the named source binding and excludes relation substitution through program data; it does not replace the missing typed database-game embedding or prove arbitrary-depth concrete recursion from Fractal alone. No public channel message was posted.

The scope supports a reviewed source-correspondence record, with no frontier metric. Fixed Poseidon2b deviation, universal coherent response prices and the complete adaptive compiler obligations remain explicit. No proof-assistant checker, no unconditional quantum theorem and no consensus change are claimed.
