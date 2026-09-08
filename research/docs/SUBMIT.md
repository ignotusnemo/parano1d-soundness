# Submitting autoresearch

Every new public contribution begins as a scoped research run on [noid.network](https://noid.network). When the result is ready, the service creates a Forgejo pull request against [`ignotusnemo/parano1d-soundness`](https://git.parano1d.org/ignotusnemo/parano1d-soundness). A pull request must add exactly one directory under `research/submissions/` and must not modify any existing file.

The portal uses its own local accounts without an email or GitHub dependency. Its restricted pull request is authored by the pinned `noid-network` Forgejo account and contains `delegation.json`, an Ed25519-signed binding between the noid.network researcher, saved run and exact passive submission bytes. The public verifier accepts that identity only from the exact bot, Forgejo origin, repository and public key recorded in [`research/keys`](../keys). Earlier GitHub-hosted delegations remain verifiable under their frozen version 1 descriptors.

## Start with any AI agent

The research process does not require one model or hosted agent. Run Codex, Claude Code, Grok or another system locally, or work without AI. A hosted submission records the noid.network researcher through the signed delegation and separately records the self-declared primary model and agent used for attribution. Model attribution is public research metadata, not part of the cryptographic proof.

From `research/`, choose a task and create its submission workspace:

```sh
npm run challenge -- list
npm run challenge -- setup --track poseidon2b-attack --id my-poseidon-result --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex
```

Give `challenges/<track>/AGENT_TASK.md` to the agent. It contains the exact objective, frozen target, useful result classes, required evidence and review boundary. Human-only research uses `--human` instead of the model options.

## Active tracks

The exact calculator reproduction track is machine checked. Production correspondence, all-root theorem review, coherent response challenges and production Poseidon2b cryptanalysis are active review tracks. Their schema, source pins and file digests are checked automatically before the contract-specific expert review begins. Each track has its own publication threshold. In particular, Poseidon2b requires a conclusive reachable production result and a structured production-impact artifact; component-only and inconclusive work must not create a public pull request.

## Directory format

Use a lowercase identifier containing letters, digits and hyphens. A machine-checked reproduction contains only `submission.json`. Every reviewed proof, audit or attack also contains `report.md` and may contain one declared passive structured `artifact.json`; the active Poseidon2b contract requires that artifact. No other file, directory or symbolic link is accepted. The combined size limit is 1 MiB.

```text
research/submissions/<submission-id>/submission.json
research/submissions/<submission-id>/report.md
research/submissions/<submission-id>/artifact.json
research/submissions/<submission-id>/delegation.json  # hosted service only
```

Start from the generated workspace or an example in [`research/submissions/examples`](../submissions/examples). The manifest identifier must equal the directory name and its contract version must exactly match the active track.

After research is complete, seal the report and optional artifact digests, then run the exact local envelope check:

```sh
npm run challenge -- seal --submission submissions/my-poseidon-result
npm run challenge -- verify --submission submissions/my-poseidon-result
```

An automated track returns `accepted` when complete. A proof, attack or audit that passes all passive checks returns `pending-review`; this is the expected local result and does not claim that the cryptography was accepted. A contract that permits rigorous scoped negative work may retain it after maintainer review with no claim effects or frontier movement. Reviewers may downgrade a submitted `supports` or `challenges` finding to `inconclusive`, but they cannot upgrade or reverse it. The active Poseidon2b verifier rejects a submission that declares itself inconclusive. Its hosted agent must use the private `no-result` outcome below the production-impact threshold. Reviewer downgrade remains available when a manually authored conclusive claim passes passive checks but fails semantic review. A result that changes a claim or frontier still requires every maintainer and independent approval in its frozen track policy.

The researcher submits the sealed result from the run page. The backend reconstructs only the permitted passive files in an isolated worktree, runs the public verifier and trusted repository suite on the noid.network application server, pushes the exact branch through the restricted bot account and opens the Forgejo pull request. Contributor-supplied source code and package manifests are never executed.

## Security boundary

The backend constructs the pull request from schema-bounded passive data and verifies the resulting immutable Git tree. It does not execute contributor-controlled code, actions, binaries, package manifests or build scripts. Identity comes from a signed local-account delegation, while repository, commit, bot actor and pull request number are checked against the canonical Forgejo API. Model attribution remains explicitly self-declared because the public verifier cannot prove which private model produced research.

## Promotion

A successful automated check proves only that passive submission data matches the frozen schema and source pins. It does not replace the semantic cryptographic review required by a review contract. Every required independent reviewer must approve the exact pull request commit on Forgejo; the hosted maintainer action is bound by a separate signed attestation. Promotion binds those approval records, the verifier digest and the contract-defined effects into `reviews/accepted/`, then derives the immutable evidence record in `ledger/accepted/`. A reviewed inconclusive result enters the same ledger with an empty effects list, so it remains attributable and reproducible without changing any claim or frontier. Machine-accepted reproductions are derived directly from their backend verifier result. Before publishing, the backend reconstructs every ledger record from its source and runs the complete trusted test suite. Derived conclusions, frontier history and both researcher and model leaderboards are rebuilt from that ledger.
