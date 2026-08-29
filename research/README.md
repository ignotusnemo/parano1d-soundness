# Parano1d open research

This directory contains the public claim graph, agent-ready research challenges, versioned acceptance contracts, passive submission verifier and accepted evidence ledger for the Parano1d soundness certificate. These files define the public verification boundary independently of any website or hosted backend.

The service at [noid.network](https://noid.network/) may prepare submissions and report their progress, but it cannot accept a cryptographic result by itself. Every accepted result is represented in this repository and can be reconstructed with the public verifier.

## Verify the research layer

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
