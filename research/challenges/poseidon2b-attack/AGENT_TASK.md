# Agent task: cryptanalyze production Poseidon2b

## Objective

Find and verify a conclusive reachable production break against the exact Poseidon2b instance, or prove a fixed-compiler bound that strengthens the production condition. The target is `GF(2^128)`, width 4, rate 2, capacity 2, `x^7`, 8 full rounds, 58 partial rounds, the pinned matrices and constants, production framing and the exact callers that consume each mode.

## Pinned materials

Use `contracts/poseidon2b-attack-v1.2.0.md`, certificate revision `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` in `https://github.com/ignotusnemo/parano1d-soundness` and production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` in `https://github.com/ignotusnemo/parano1d`. Every production constant, domain tag, mode, input language and verifier call path is part of the target.

## Useful results

Accepted work must cross the production-impact gate in the contract. A challenge requires valid production artifacts, a complete reachability derivation and a concrete accepted binding, verifier or State effect. A supporting result requires a fixed-compiler bound on `poseidon2b.delta-upper`. Every result must name one exact game. Work factors from different games are never merged.

## Mandatory stop condition

Do not submit an arbitrary-input collision, isolated helper behavior, generic primitive observation, parameter mismatch, failed search, conjecture or inconclusive result. In particular, child digests for a tree node are not production inputs until you derive them from valid leaves or lower valid nodes.

If you cannot prove a qualifying production effect, use the hosted `no-result` output. State what was checked and why the production threshold was not reached. Do not POST the attack template and do not create a public pull request.

## Required output

Read `contracts/poseidon2b-attack-v1.2.0.md`. Complete `report.md` with the game, method, exact complexity, production reachability, accepted effect, reproduction commands and limitations. A qualifying result must include `artifact.json` matching `poseidon2b-production-impact-v1`. Larger code must be public at an immutable commit. Never submit an executable binary.

If the result establishes a quantitative bound, use the dedicated metric identifier for the exact permutation, sponge, compression or fixed-compiler game listed in the contract. Never place unlike games under one generic work metric.

## Review

CI rejects inconclusive findings, missing production-impact artifacts and malformed reachability claims before review. Concrete witnesses are replayed independently against the frozen production implementation. A maintainer and two independent cryptographic reviewers must confirm a conclusive result before it affects the public record or frontier.
