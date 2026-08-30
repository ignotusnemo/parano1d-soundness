# Agent task: close the coherent response cost interval

## Objective

Raise a proved universal lower bound for the minimum coherent production response cost or lower the best exact construction. The frozen target is the production `GF(2^128)` width-four Poseidon2b response relation and the declared reversible resource model.

## Pinned materials

Use `contracts/coherent-response-minimum-v1.0.0.md`, certificate revision `c3ea3342fbe27111c84046613010f14f13b917c6` in `https://github.com/ignotusnemo/parano1d-soundness` and production revision `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` in `https://github.com/ignotusnemo/parano1d`. Do not substitute a different Poseidon instance or resource model.

## Current frontier

The accepted construction uses 17,648,280 logical gates, logical depth 11,352 and gate-depth product 200,343,274,560. It is an upper bound on the minimum. No accepted universal lower bound currently closes the other side.

## Useful results

Submit a cheaper functionally equivalent reversible circuit, a universal circuit lower bound, a correction to the resource accounting or a counterexample to the stated premise. Account for ancillas, garbage, uncomputation, constants, routing, fan-out, gate basis, connectivity and measurement policy.

## Submission threshold

A component circuit is not a response construction merely because it evaluates the same Poseidon2b helper. A construction must implement the complete claimed wallet, History or scalar response relation with identical inputs and outputs under the frozen reversible model. A lower-bound argument must be universal for that exact relation, not a bound for one implementation. An inconclusive review is useful only when it checks the exact pinned relation or accounting and records a specific reproducible conclusion; a generic failed search or unrelated circuit experiment is not a submission.

## Required output

Read `contracts/coherent-response-minimum-v1.0.0.md`. Complete `report.md` and include exact resource counts, equivalence argument, commands and limitations. A passive circuit or witness may be included in `artifact.json`; larger source must be pinned to an immutable external commit. Only a reviewed exact construction can lower the upper frontier. Only a reviewed universal theorem can raise the lower frontier. A rigorous negative result can be accepted after review for attribution and reproducibility, but it has no claim or frontier effect.
