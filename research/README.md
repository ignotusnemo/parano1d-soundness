# Parano1d open research

This directory contains the public claim graph, agent-ready research challenges, versioned acceptance contracts, passive submission verifier and accepted evidence ledger for the Parano1d soundness certificate. These files define the public verification boundary independently of any website or hosted backend.

The service at [noid.network](https://noid.network/) prepares submissions and reports their progress. Its authenticated maintainer makes the final semantic review decision; the backend signs that exact decision, checks it with the public verifier, runs the trusted tests and merges the evidence. It never treats an agent's report as automatically proving its claim. Every accepted result is represented in this repository and can be reconstructed with the public verifier.

## Verify the research layer

The current official certificate includes the wallet Johnson refinement and the September 8, 2026 response-accounting correction. Its revisions are pinned in `lib/pins.ts`, and its exact report digest and renewed metrics are recorded in `evidence/official/response-accounting-2026-09-08.json`. Earlier baselines, submissions, signed reviews and ledger records are preserved unchanged. The correction explicitly withdraws the incomplete historical construction metrics from current selection. It does not erase their history or count as a frontier improvement.

Active challenges use renewed versioned contracts. `catalog/archive/` retains preceding source pins and reproduction values for explicit accepted-ledger replay. New submissions must use the active contract and cannot present an old certificate as a reproduction of the new one. Earlier reviews remain evidence about their original revisions. Response-circuit costs are not end-to-end security bits; the conditional Category 1 probability envelope is also distinct from its dominant-term gate-depth floor.

```sh
npm ci
npm run typecheck
npm test
npm run ledger:verify
```

Submission instructions are in [`docs/SUBMIT.md`](docs/SUBMIT.md). Active machine and review contracts are in [`contracts/`](contracts/).

List the tasks and prepare a workspace for any local AI agent with:

```sh
npm run challenge -- list
npm run challenge -- setup --track poseidon2b-attack --id my-result --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex
```

Machine-accepted reproductions and expert-reviewed results both enter a derived immutable ledger. The noid.network backend reconstructs every accepted record, verifies current Forgejo pull request provenance and runs the complete trusted repository suite before publication. The operator procedures are in [`ledger/README.md`](ledger/README.md) and [`reviews/README.md`](reviews/README.md).
