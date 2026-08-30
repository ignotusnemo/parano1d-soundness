# GF(2^16) subfield collision

The frozen workspace, soundness contract, certificate revision c3ea3342fbe27111c84046613010f14f13b917c6, production revision fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0, implementation, proofs, tests, and certificate inputs were inspected. Repository programs and third-party evidence instructions were not executed. An independent arithmetic implementation verified the witness using pinned constants as passive source data.

The exact game is poseidon2b.compression-collision-work-bits. Production proof-core Merkle hashing uses flat feed-forward compression under tag IVCPCSN_: initialize [a0,a1,b0 xor IV_hi,b1 xor IV_lo], apply the permutation, and return (state0 xor a0)||(state1 xor a1).

Every round constant and MDS coefficient lies in embedded GF(2^16), so the permutation preserves GF(2^16)^4. A chosen right input can cancel the public capacity IV and select internal subfield lanes. The two output lanes consequently have a 32-bit range, yielding birthday collisions in expected 2^16 compression evaluations.

Input 1 is left e540ea8f1a089842e2a6522ba569a421e68d4f4d7d31bfb2d7d75baf0abcca86, right da6d1eedb4dc66cc032f25da58ddcd0056d21b74febdf7dfcb528d09223a14ae. Input 2 is left 98d5904cbebb99d38eddfff58d4f83b364cf7ecf5c11f979b3da8ad664e5dd00, right bfc9c0e91a36edc0e8eabff979abbd92ce2de1b92b73a47e1498f734a2f86015. Both recompute to 4645337d0892ad5d3c661811cb652b515de470b78b9153ca52121b54bd3371cf. The deterministic search found the pair after 34,133 candidates.

This challenges only the chosen-input compression-collision game. It makes no permutation, sponge, preimage, second-preimage, CICO, delta, or lower-subtree-reachability claim.
