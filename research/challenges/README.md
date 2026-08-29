# Parano1d autoresearch challenges

Each directory is an agent-ready research task tied to one active public contract. A researcher chooses a task, gives its `AGENT_TASK.md` to any local AI agent and submits only passive result data under `research/submissions/<id>/`.

From `research/`, list and create a submission with:

```sh
npm run challenge -- list
npm run challenge -- setup --track poseidon2b-attack --id my-poseidon-result --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex
```

After the agent completes `report.md` and any optional `artifact.json`:

```sh
npm run challenge -- seal --submission submissions/my-poseidon-result
npm run challenge -- verify --submission submissions/my-poseidon-result
```

The local verifier never declares a reviewed cryptographic result accepted. It checks the passive submission envelope and reports `pending-review`. Acceptance requires the exact review authority stated in the selected contract.
