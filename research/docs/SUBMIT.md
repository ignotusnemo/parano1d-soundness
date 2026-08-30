# Submitting autoresearch

Every public contribution is a GitHub pull request against `ignotusnemo/parano1d-soundness`. A pull request must add exactly one directory under `research/submissions/` and must not modify any existing file.

The hosted noid.network service can prepare the same restricted pull request after GitHub sign-in. Such a pull request is authored by the pinned GitHub App bot and contains `delegation.json`, an Ed25519-signed binding between the researcher, saved run and exact passive submission bytes. The protected verifier accepts that identity only from the exact bot and public key recorded in [`research/keys`](../keys). A direct pull request has no delegation and continues to use its GitHub author.

## Start with any AI agent

The research process does not require one model or hosted agent. Run Codex, Claude Code, Grok or another system locally, or work without AI. A direct submission records the GitHub researcher from the trusted pull request event and separately records the self-declared primary model and agent used for attribution. Model attribution is public research metadata, not part of the cryptographic proof.

From `research/`, choose a task and create its submission workspace:

```sh
npm run challenge -- list
npm run challenge -- setup --track poseidon2b-attack --id my-poseidon-result --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex
```

Give `challenges/<track>/AGENT_TASK.md` to the agent. It contains the exact objective, frozen target, useful result classes, required evidence and review boundary. Human-only research uses `--human` instead of the model options.

## Active tracks

The exact calculator reproduction track is machine checked. Production correspondence, all-root theorem review, coherent response challenges and production Poseidon2b cryptanalysis are active review tracks. Their schema, source pins and file digests are checked automatically before the contract-specific expert review begins.

## Directory format

Use a lowercase identifier containing letters, digits and hyphens. A machine-checked reproduction contains only `submission.json`. Every reviewed proof, audit or attack also contains `report.md` and may contain one declared passive structured `artifact.json`. No other file, directory or symbolic link is accepted. The combined size limit is 1 MiB.

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

An automated track returns `accepted` when complete. A proof, attack or audit that passes all passive checks returns `pending-review`; this is the expected local result and does not claim that the cryptography was accepted. A rigorous inconclusive result may still be accepted after maintainer review as a public negative research record. Such a record has no claim effects and cannot move a frontier. Reviewers may also downgrade a submitted `supports` or `challenges` finding to `inconclusive` without changing the signed submission. They cannot upgrade or reverse the submitter's finding. A result that changes a claim or frontier still requires every maintainer and independent approval in its frozen track policy.

Commit only the new submission directory to a branch in your fork, push it and open a pull request against `ignotusnemo/parano1d-soundness:main`. The protected submission workflow reads the passive files through the GitHub API and publishes its result on the pull request.

## Security boundary

The verifier reads the pull request files as passive data through the GitHub API. It does not check out or execute contributor-controlled code, actions, binaries, package manifests or build scripts. Identity, repository, commit and pull request number come from the trusted GitHub event rather than from the submission manifest. Model attribution remains explicitly self-declared because a public GitHub workflow cannot prove which private model produced research.

## Promotion

A successful automated check proves only that passive submission data matches the frozen schema and source pins. It does not replace the semantic cryptographic review required by a review contract. Every required reviewer must approve the exact pull request commit on GitHub. Promotion binds those live approval records, the verifier digest and the contract-defined effects into `reviews/accepted/`, then derives the immutable evidence record in `ledger/accepted/`. A reviewed inconclusive result enters the same ledger with an empty effects list, so it remains attributable and reproducible without changing any claim or frontier. Machine-accepted reproductions are derived directly from their protected verifier result. CI reconstructs every ledger record from its source before publishing. Derived conclusions, frontier history and both researcher and model leaderboards are rebuilt from that ledger.
