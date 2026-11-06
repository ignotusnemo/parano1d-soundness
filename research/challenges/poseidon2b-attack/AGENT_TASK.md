# Agent task: cryptanalyze production Poseidon2b

## Objective

Find and verify a conclusive reachable production break against the exact Poseidon2b instance, or prove a fixed-compiler bound that strengthens the production condition. The target is `GF(2^128)`, width 4, rate 2, capacity 2, `x^7`, 8 full rounds, 58 partial rounds, the pinned matrices and constants, production framing and the exact callers that consume each mode.

## Pinned materials

Use `contracts/poseidon2b-attack-v3.0.0.md`. Both production and certificate pins are `848209d5db75137483cb41a94b310ad11463473f` in `https://git.parano1d.org/ignotusnemo/parano1d`. Clone that complete production repository and inspect `noid_soundness/docs/v2-retirement.md`, `noid_soundness/src/v2.rs` and the relevant verifier paths. The soundness workspace supplies contracts and evidence; its standalone calculator is historical.

## Useful results

Accepted work must cross the production-impact gate in the contract. A challenge requires valid production artifacts, a complete reachability derivation and a concrete accepted binding, verifier or State effect. A supporting result requires a fixed-compiler bound on `poseidon2b.delta-upper`. Every result must name one exact game. Work factors from different games are never merged.

## Mandatory stop condition

Do not submit an arbitrary-input collision, isolated helper behavior, generic primitive observation, parameter mismatch, failed search, conjecture or inconclusive result. In particular, child digests for a tree node are not production inputs until you derive them from valid leaves or lower valid nodes.

If you cannot prove a qualifying production effect, use the hosted `no-result` output. State what was checked and why the production threshold was not reached. Do not POST the attack template and do not create a public pull request.

## Required output

Read `contracts/poseidon2b-attack-v3.0.0.md`. Complete `report.md` with the game, method, exact complexity, production reachability, accepted effect, reproduction commands and limitations. A qualifying result must include `artifact.json` matching `poseidon2b-production-impact-v1`. Larger code must be public at an immutable commit. Never submit an executable binary.

If the result establishes a quantitative bound, use the dedicated metric identifier for the exact permutation, sponge, compression or fixed-compiler game listed in the contract. Never place unlike games under one generic work metric.

## Review

Automated checks reject inconclusive findings, missing production-impact artifacts and malformed reachability claims before review. Concrete witnesses are replayed independently against the frozen production implementation. The authenticated portal maintainer reviews the conclusive evidence and signs the final decision before checked publication; this does not relax the production-impact threshold.


## Current target

The target claim is `v21-fixed-poseidon2b-delta`. Read the complete v2 contract before analysis. For new submissions use contract `2.0.0` and the current source pair. Historical results remain attributable to their original profiles.

Current production: `848209d5db75137483cb41a94b310ad11463473f`. Current certificate: `7ead11a3afb452fb14eea505cfa913ce20a87f9a`. Use the exact fields generated from the active contract. Review the October conditions in `docs/october-2026-security-review.md`.
