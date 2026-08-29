# Agent task: cryptanalyze production Poseidon2b

## Objective

Find and verify concrete cryptanalysis against the exact production Poseidon2b instance, or prove a fixed-compiler bound that strengthens the production condition. The target is `GF(2^128)`, width 4, rate 2, capacity 2, `x^7`, 8 full rounds, 58 partial rounds, the pinned matrices and constants, production framing and two-to-one feed-forward compression.

## Pinned materials

Use `contracts/poseidon2b-attack-v1.0.0.md`, certificate revision `c3ea3342fbe27111c84046613010f14f13b917c6` in `https://github.com/ignotusnemo/parano1d-soundness` and production revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` in `https://github.com/ignotusnemo/parano1d`. Every production constant, domain tag and mode is part of the target.

## Useful results

Accepted work includes a collision, preimage, second-preimage or CICO witness, a compression or sponge attack, a differential or algebraic trail with exact production specialization, a fixed-compiler QROM bound, an indifferentiability result or a counterexample. Every result must name one exact game. Work factors from different games are never merged.

## Required output

Read `contracts/poseidon2b-attack-v1.0.0.md`. Complete `report.md` with the game, method, exact complexity, production mapping, reproduction commands and limitations. Put concrete passive witnesses or structured trails in `artifact.json`. Larger code must be public at an immutable commit. Never submit an executable binary.

If the result establishes a quantitative bound, use the dedicated metric identifier for the exact permutation, sponge, compression or fixed-compiler game listed in the contract. Never place unlike games under one generic work metric.

## Review

CI checks passive inputs and source pins without running contributor code. Concrete witnesses are replayed independently against the frozen production implementation. Analytical claims require two cryptographic reviewers before they affect the public record or frontier.
