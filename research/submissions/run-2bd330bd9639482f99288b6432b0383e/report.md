# Complete scalar response with charged parallel S-box scheduling

## Claim and pins
Contract: coherent-response-minimum-v2.0.0; target claim: v2-coherent-response-minimum. Research workspace: 14eb188aecd86a39cec523740abeb91031cb6a08. Production and integrated certificate: 50d6dac5a37b9f1be425b5e6cd823de48f843b50.

I give a complete compositional construction for the exact fixed-register scalar oracle U_f: |s,z,0> maps to |s,z XOR pi_0(P(s)),0>, where s comprises four tower-basis GF(2^128) lanes and z is the original named 128-bit response register. P is the pinned width-four, rate-two, x^7, RF=8, RP=58 production permutation. The construction has simultaneous upper bounds G=100256120 logical gates, D=18057 logical layers, GD=1810324758840 and W=21799732 total wires. These are exact integer conservative bounds, not asserted minimal counts. The product is 198045465120 below the frozen construction upper bound 2008370223960. Gate count alone increases by 23040; the improvement is in gate-depth product.

The proposed finding supports a cheaper construction upper bound, subject to independent equivalence and resource review. It does not prove a universal lower bound or refute the declared scalar price 200343274560, because the new upper bound remains larger than that price.

## Frozen model and reusable generators
The basis, connectivity and policy are exactly those in noid_soundness/docs/response-accounting.md: CNOT, one-qubit Clifford and T; all-to-all logical connectivity; gates within a layer have disjoint wire sets; zero ancillas; exact unitary computation; no measurements, classical feed-forward, free output relabeling or physical error-correction costs. An exact Toffoli uses the pinned 15-gate, at-most-eight-layer decomposition. Adjoint cleanup follows the same pinned cost convention. Public X constants are charged as one-qubit Clifford gates. No routing gates are needed under all-to-all connectivity. All fanout is charged CNOT fanout, not cloning arbitrary states.

Reuse the finite input-preserving binary linear-map generator described in response-accounting.md and exercised by Circuit::linear in reversible_multiplier.rs. For n bits it costs at most 2n^2 gates, 2 log2(n)+2 depth and n^2+n additional wires including output. It creates dedicated copies using CNOT trees, then computes disjoint output parity trees. This implements the actual source-derived squaring, representation-change and MDS binary matrices, not arbitrary substituted matrices.

Reuse Circuit::polynomial followed by Circuit::reduce from reversible_multiplier.rs as a forward field-product generator with retained workspace, excluding its later response copy and inverse. Its two input registers remain unchanged; its low product wires equal multiplication modulo X^128+X^7+X^2+X+1. Its bounds are 49531 gates, depth 49 and 6305 additional wires including result. The 508 reduction CNOTs are included. Each invocation has fresh workspace; garbage is retained until the global inverse.

## New S-box circuit and disjointness proof
For each active lane x:
1. Use a 128-bit input-preserving squaring map to generate x2=x^2, retaining x and its workspace. Cost bound: 32768 gates, 16 layers, 16512 additional wires.
2. Allocate a fresh zero 128-bit register c. Apply CNOT(x2_i,c_i) for every i, one layer of 128 disjoint CNOTs. This leaves x2 intact and produces the computational-basis copy c=x2. On superpositions this is reversible entangling fanout, not an independent clone.
3. Run two circuits in parallel: squaring(c) produces x4=x^4 using c and fresh linear-map workspace; the forward multiplier(x,x2) produces x3=x^3 using x, x2 and distinct fresh multiplication workspace. Their ENTIRE wire sets are disjoint after the copy stage: the squaring branch does not touch x or x2, and the multiplication branch does not touch c or the squaring workspace. Shared quantum entanglement imposes no additional wire conflict. Thus this stage costs the sum of their gates and max(16,49)=49 layers.
4. Run the forward multiplier(x3,x4) on its two result registers with another fresh workspace. It yields x7=x^7 in 49 layers and retains all inputs and garbage.

The identity follows for every field element from x7=(x*x^2)*(x^2)^2=x^7, including zero. All constituent circuits are exact basis permutations without input-dependent phases, so linear extension establishes coherent correctness. The additional register c is cleaned when the entire schedule is reversed after the scalar output XOR.

Consequently one S-box has G_S=2*32768+2*49531+128=164726; D_S=16+1+max(16,49)+49=115; W_S=2*16512+2*6305+128=45762 additional wires. This improves depth from 130 to 115 while charging every copied bit. Four full-round S-boxes use disjoint lane workspaces and run in parallel; a partial round uses one. No overlap of those lane inputs is assumed.

## Complete response composition
Keep every other component of the source-pinned complete scalar construction. Apply four parallel tower-to-flat input conversions, the initial actual external MDS linear map, the 66 production rounds with their actual constants and actual full/partial MDS maps, and one flat-to-tower scalar-output conversion. A round is a constant layer, the active S-box layer just specified, and its MDS layer. Nonactive partial-round lanes carry through unchanged into the matrix map. The binary MDS matrices are the conjugates of the pinned tower matrices under the source basis conversions. There are 90 S-boxes, 67 matrix layers, at most 90*128 constant X gates, and five lane basis maps.

For lane maps G_L=32768, D_L=16, W_L=16512. For full-state maps G_L=524288, D_L=20, W_L=262656. Four input basis maps run in parallel and the output basis map is a later stage.

G_f = 90*164726 + 67*524288 + 90*128 + 5*32768 = 50127996.
D_f = 2*16 + 20 + 66*(1+115+20) = 9028.

Copy the final scalar into the existing arbitrary z using 128 disjoint CNOTs in one layer, then execute the inverse of the COMPLETE forward construction, including all 90 new copy stages, all linear fanout/parity networks, reduced multipliers, constants and basis maps. The inverse does not act on z. Since the entire forward computation retained inputs and workspace, its inverse restores every ancilla to zero and the original s unchanged. Therefore this is a construction of the complete claimed response, not merely of a permutation helper or an S-box.

G_U = 2*50127996+128 = 100256120.
D_U = 2*9028+1 = 18057.
G_U*D_U = 1810324758840.
W_U = 512+128 + 90*45762 + 67*262656 + 5*16512 = 21799732.
Initially zero ancillas = W_U-640 = 21799092. No output garbage remains. Retaining all workspaces avoids any implicit free erasure or reuse assumption.

## Correspondence, channel claims and evidence
Read the complete frozen contract and both accepted review records for Borealis #9 and Delta #11. Public channel messages 11 and 13 were checked before analysis. Borealis's omitted reduction is not repeated: the reused multiplier includes all 508 reduction CNOTs. Delta's accepted target-touch lower bound remains 128 gates and depth one in the frozen exact unitary model; I do not inherit the channel message's broader measurement/feed-forward assertion, which the pinned reviewed document explicitly does not establish. What changes here is only a constructive upper bound, not either earlier finding.

Production correspondence is anchored in noid_poseidon2b/src/native/permutation.rs (actual matrices, constants, schedule and tower_sbox_x7_reference); noid_soundness/src/parameters.rs; reversible_multiplier.rs; response_audit.rs; and docs/response-accounting.md. The native reference uses exactly x2, x4, x3, x7 as above. Read docs/v2-retirement.md and src/v2.rs: scalar retirement events reuse the separately declared resource price. Inspected the sparse_c1 transcript and opening-verification paths; this report makes no claim to optimize those complete duplex/vector relations.

The four research input files were decompressed and independently checked against the frozen reproduction record for exact size and SHA-256: history-step.runtime 2214607 bytes, v2-runtime-metadata.bin 2258540 bytes, and each retirement key 304 bytes. These runtime/key inputs are not consumed by this scalar construction and no preprocessing provenance claim is made.

Reproduction steps: obtain the two complete pinned repositories; inspect the cited source functions and instantiate the four-stage S-box recipe above with the pinned generators. At the production root run `cargo test --release --locked -p noid_soundness`. All 41 tests passed in this run, including every 128^2 bilinear basis pair, GF(16) input/input/response triples, all 255 reduction basis vectors and cleanup, exact multiplier resources, input-preserving linear fanout, scalar upper accounting and production parameter correspondence. Independently recompute the integer equations in this report; they yield the stated counts and strict product improvement. The exponent identity was also checked exhaustively on GF(16) and the 8-bit field modulo 0x11b. These small-field checks are sanity checks; the all-input equivalence argument is the field identity and reversible composition, not extrapolation from testing.

## Limitations and conclusion
The frozen tests validate reused kernels and the old bound, not a newly emitted full 100-million-gate netlist. This submission provides a finite compositional generator specification and its equivalence/disjointness/resource proof; it does not claim to have simulated the entire constructed oracle. Every changed gate is specified by the 128-bit CNOT copy and the branch schedule. An independent circuit reviewer must validate this composition before any frontier effect.

No optimization of wallet or History vector queries, no batch amortization theorem, no universal response minimum, no physical-hardware connectivity claim and no stronger Category 1 conclusion is established. In particular the declared price remains a premise. The result is a reviewable candidate improvement of the COMPLETE scalar construction upper product from 2008370223960 to 1810324758840 under the same frozen unitary model.
