# Production Poseidon2b cryptanalysis contract v3.0.0

## Published target

The target is the exact public production Poseidon2b instance: `GF(2^128)`, state width 4, rate 2, capacity 2, `x^7`, 8 full rounds, 58 partial rounds, pinned external and internal matrices, production constants, `FsLaneChallenger` framing, typed domains and the concrete production callers that consume each mode.

## Submission threshold

This track accepts only a conclusive production result. It does not accept an `inconclusive` submission, a failed search or an isolated component observation.

A challenging result must establish at least one of these production effects:

1. Two different valid production artifacts that reach the same accepted binding, commitment or root.
2. A proof accepted by the pinned production verifier for an invalid statement.
3. A concrete divergence between the pinned production prover and verifier.
4. A preimage, second-preimage or collision whose inputs are derived from the valid production input language and whose effect reaches the declared verifier or State path.
5. A counterexample that violates the fixed-compiler condition used by the production certificate.

A supporting result must provide a fixed-compiler bound on `poseidon2b.delta-upper` with a complete production specialization and a public immutable proof artifact.

An arbitrary-input permutation, sponge or compression witness is not a production result merely because it calls the same helper. The report must derive every witness input from valid production artifacts or prove why the production verifier accepts those inputs. A component result without that derivation must not be submitted to this track.

## Required production-impact artifact

Every submission includes `artifact.json` with `artifactType` equal to `poseidon2b-production-impact-v1`. The artifact must bind:

- the exact production commit and security game;
- the production entry points and immutable source locations;
- the derivation of every input from valid production data;
- the concrete accepted binding, verifier or State effect;
- one or more digested witnesses and any immutable source links;
- exact reproduction steps and the expected result.

The artifact finding must match `submission.json`. A supporting artifact uses `fixed-compiler-bound`. A challenging artifact uses a reachable production counterexample or violation. Filling these fields with assertions is not evidence. Reviewers reproduce the derivation and effect before acceptance.

## Exact games

Accepted exact metrics use `poseidon2b.permutation-collision-work-bits`, `poseidon2b.permutation-preimage-work-bits`, `poseidon2b.permutation-second-preimage-work-bits`, `poseidon2b.permutation-cico-work-bits`, `poseidon2b.sponge-collision-work-bits`, `poseidon2b.compression-collision-work-bits`, `poseidon2b.delta-upper` or `poseidon2b.delta-lower`. Work metrics are exact non-negative decimal bit values. Delta metrics are exact decimal probabilities in `[0, 1]`. Work factors from different games are never combined.

## Do not submit

Do not submit any of the following:

- arbitrary child digests without a valid production reachability construction;
- behavior of an isolated helper with no accepted production effect;
- a result for different parameters, matrices, rounds, domains or modes;
- a conjecture, heuristic estimate or unverified model output;
- a failed search or a report whose final classification is inconclusive.

When no qualifying result is found, finish the hosted run with the private `no-result` outcome. This closes the run without creating a pull request, ledger entry or leaderboard credit. A directly authored pull request that claims a conclusive result may still be downgraded by the reviewer if its semantic evidence does not establish the claimed production effect. That downgrade records no claim or frontier effect and does not validate the overclaim.

## Submission and review

The pull request contains `submission.json`, `report.md`, `artifact.json` and the hosted delegation when applicable. CI checks the passive inputs, source pins, finding, exact game and production-impact artifact schema without executing contributor-controlled code. A maintainer verifies production correspondence and two independent cryptographic reviewers confirm a conclusive result before it changes the public record or frontier.

## Effect

A confirmed attack records only the exact game and production effect it establishes. A confirmed fixed-compiler bound may strengthen the declared condition. Classical cryptanalysis is never presented as the end-to-end post-quantum result. The hosted agent creates no public submission below the production-impact threshold. Reviewer downgrade remains available for a manually authored submission and always produces an empty effects list.

## Current source and certificate

Production is pinned to Parano1d v2.1.0, `848209d5db75137483cb41a94b310ad11463473f`. The exact joint-ancestry certificate is pinned separately to `7ead11a3afb452fb14eea505cfa913ce20a87f9a` in the public soundness repository. Read `docs/v2.1-certificate.md` and the source paths relevant to the claimed result.

This contract supersedes the earlier version for new work. Archived contracts and accepted records retain their original source pins for historical replay. Every result identifies its source revision and exact scope. Earlier accepted records retain their original targets.

The fixed-compiler target is `v21-fixed-poseidon2b-delta`. Use the exact headroom in the current v2 report. The scalar permutation is unchanged, but a reachability or compiler claim must name a current v2 acceptance path. The artifact schema name `poseidon2b-production-impact-v1` is a data format version, not a protocol version.

## V2.1 source and October conditions

Production revision: `848209d5db75137483cb41a94b310ad11463473f`. Certificate implementation: `7ead11a3afb452fb14eea505cfa913ce20a87f9a`. The active machine fields in `catalog/tracks/poseidon2b-attack.json` are normative.

Establish a production-reachable fixed-Poseidon2b effect or an event-specific deviation bound for the v2.1 certificate. Preserve exact tags, canonical framing, feed-forward, digest lanes and total preprocessing charges.

The joint accounting retains all twenty historical events and adds six current-bank events. The exact envelope is conditional on source-linked extraction, RS-specific grouped common agreement and source restoration, coupled native/ideal child compilation, fixed-Poseidon2b deviation, honest authenticated preprocessing and declared response charges. All adversarial preprocessing and verification queries share one total charged budget.

A domain type is a namespace, not a preimage-multiplicity promise. Free oracle-dependent advice requires a separately quantified model. A squeezing distinguisher must map to the actual accepted event and fixed mode.

See [the v2.1 derivation](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/v2.1-certificate.md) and [the full October review](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/october-2026-security-review.md).
