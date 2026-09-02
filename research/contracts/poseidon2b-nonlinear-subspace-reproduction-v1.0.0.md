# Poseidon2b nonlinear-subspace reproduction contract v1.0.0

## Published target

The target is the exact specialization of ePrint 2026/1792 to Parano1d's
production width-four Poseidon2b feed-forward compression. The certificate is
pinned to revision `d0da722f4785ca05881195a33649d124a1495a89` and the
production snapshot is pinned to revision
`fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0`.

The reviewed paper archive version is `20260824:125701`, with SHA-256
`006cf8bc3b47df053d662b6552aa82fd8add2a75a152e08f9c63db73a29564cb`.

## Accepted work

The trusted verifier exports the pinned certificate revision, builds it with
the locked release dependencies and executes the exact report. It validates
the complete report digest together with the production matrix rank core,
linear and nonlinear trail lengths, and the lowest of the four Macaulay
attack-cost projections. Contributor-controlled code is never executed.

## Frozen result

The production compression has `E_c=2` and one active S-box per partial round.
The resulting trail lengths are two and four partial rounds. Evaluation of the
Appendix B.7 even-construction core in the production tower basis gives
`0x0000000000000000000000000000be32`, which is nonzero. The lowest reproduced
`omega=2` semi-regular projection is `1022.830074998558` bits.

This remains above the `409.873818620410`-bit feed-forward projection already
instantiated from ePrint 2026/306.

## Effect

A matching reproduction is accepted as an attributed audit record for the
production Poseidon2b claim. It creates a public timeline point and leaderboard
entry, but it does not move the cryptographic frontier. The projection is not a
claim of 1022-bit security, a universal lower bound, a concrete collision or a
valid-tree reachability witness.
