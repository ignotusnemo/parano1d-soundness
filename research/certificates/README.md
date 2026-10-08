# Current v2 certificate reproduction

All active research tasks target Parano1d v2.0.3 at production and integrated certificate commit `50d6dac5a37b9f1be425b5e6cd823de48f843b50`. The current calculator is in the production repository, not the historical standalone crate in the root of this research workspace.

Obtain the complete production source and retain its Git metadata:

```sh
git clone https://git.parano1d.org/ignotusnemo/parano1d.git /tmp/parano1d-v2-research
git -C /tmp/parano1d-v2-research checkout --detach 50d6dac5a37b9f1be425b5e6cd823de48f843b50
export PARANO1D_PRODUCTION_DIR=/tmp/parano1d-v2-research
```

Use a fresh destination if that directory already exists. From `parano1d-soundness/research`, install the locked JavaScript dependencies with `npm ci`. Rust must provide the production repository's pinned toolchain. Install the production build prerequisites, including a C compiler and libclang with its builtin headers for the MDBX dependency; see the production `docs/developers/build.md` guide. An optional `PARANO1D_CERTIFICATE_TARGET_DIR` outside submissions can preserve trusted compilation products; the verifier still archives the exact Git commit and executes the calculator. Builds use at most two Cargo jobs.

Generate and verify a passive submission with the challenge CLI. Supply the attribution options for the actual model and agent, or `--human` for human work. Hosted runs supply the required attribution automatically.

```sh
npm run challenge -- setup --track certificate-reproduction --id my-v2-result --model-provider openai --model-id gpt-6-astra --model-name "GPT-6 Astra"
npm run challenge -- verify --submission submissions/my-v2-result
```

`certificate-reproduction` executes `bench_prover`'s `noid_v2_soundness`. `poseidon2b-nonlinear-subspace-reproduction` executes the current production `noid_soundness --exact` and verifies only its complete nonlinear-subspace section. Neither task accepts the historical aggregate profile as a v2 result.

## Authenticated release inputs

`v2.0.3/` contains gzip-compressed copies of four read-only files from the official `history-step-pack-v1.tar.gz` and `history-step-pack-v2.tar.gz` assets of [v2.0.3](https://git.parano1d.org/ignotusnemo/parano1d/releases/tag/v2.0.3). The runtime from the v1 pack remains a required input to v2 retirement and ancestry verification; it is not an active v1 research task.

The pack digests, exact file lengths, SHA-256 values and independent protocol pins are published in [the release-input record](../evidence/artifacts/2026-10-08/reproduction.json). `lib/v2-certificate-runner.ts` enforces the decompressed lengths and SHA-256 values before the production calculator independently authenticates the bank, runtime and key identities. The gzip wrapper itself is not a consensus artifact.

The stored keys are checked against their independent pins and matrix identities. This reproduction does not regenerate matrix preprocessing. The exact report includes all stated composition, compiler, fixed-Poseidon2b, response-price and honest-preprocessing conditions. Reproducibility does not discharge those conditions.

## Hosted observation cache

An operator may set `PARANO1D_CERTIFICATE_OBSERVATIONS_DIR` to a private directory outside all contributor workspaces. It stores only completed protected observations, keyed by production commit, profile and the complete input manifest. The verifier validates source availability, current input digests, cache schema and every frozen result field on each submission. Corrupt or stale observations cannot change the accepted values. This avoids repeating deterministic cryptographic input authentication for every HTTP request on hosts without hardware crypto instructions. Participants independently reproduce the certificate with this optional host cache unset.

## Historical replay

Earlier contracts in `catalog/archive/` are accepted only by explicit historical ledger replay. New runs use the active v2 contracts. Existing accepted results, signatures and original source scopes are unchanged.
