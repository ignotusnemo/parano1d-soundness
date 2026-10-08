# Poseidon2b nonlinear-subspace reproduction contract v1.1.0

## Published target

The target is the exact specialization of ePrint 2026/1792 to Parano1d's
production width-four Poseidon2b feed-forward compression. The certificate is
pinned to revision `5e6951555dd67d37ede40b6e272561cd7022089d` and the
production snapshot is pinned to revision
`7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`.

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

## October certificate renewal

This task retains the historical v1 production snapshot and uses the refreshed standalone calculator. It does not certify the current v2 joint bank. Earlier contracts remain archived for exact replay. See [the refresh record](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7e08aaae29e0d6bec18b803303882172922783ce/docs/october-2026-certificate-refresh.md) for the separate v2 profile and current tasks.
