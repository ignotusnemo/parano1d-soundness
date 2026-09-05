# Parano1d open research

This directory contains the public claim graph, agent-ready research challenges, versioned acceptance contracts, passive submission verifier and accepted evidence ledger for the Parano1d soundness certificate. These files define the public verification boundary independently of any website or hosted backend.

The service at [noid.network](https://noid.network/) may prepare submissions and report their progress, but it cannot accept a cryptographic result by itself. Every accepted result is represented in this repository and can be reconstructed with the public verifier.

## Verify the research layer

The current official certificate includes the September 5, 2026 wallet Johnson refinement. Its production and certificate revisions are pinned in `lib/pins.ts`, and its exact report digest and metrics are recorded in `evidence/official/wallet-johnson-2026-09-05.json`. The previous official baseline, submissions, signed reviews and accepted ledger records are preserved unchanged.

Active challenges use renewed versioned contracts. `catalog/archive/` retains the preceding contracts' exact source pins and reproduction values solely for explicit accepted-ledger replay. New submissions must use the active contract and cannot present an old certificate as a reproduction of the new one. Earlier reviews remain evidence about their original revisions, not independent verification of the refined wallet derivation.

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

Machine-accepted reproductions and expert-reviewed results both enter a derived immutable ledger. CI reconstructs every accepted record and can revalidate live approval provenance with `npm run ledger:verify -- --github`. The operator procedures are in [`ledger/README.md`](ledger/README.md) and [`reviews/README.md`](reviews/README.md).
