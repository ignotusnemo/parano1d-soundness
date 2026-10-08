# Agent task: reproduce the nonlinear-subspace audit

## Objective

Independently execute the protected specialization of ePrint 2026/1792 for the
exact production width-four Poseidon2b compression. Confirm the concrete
matrix rank check, trail lengths and four Macaulay projections. This track
records reproducibility and does not move the cryptographic frontier.

## Pinned materials

Use `contracts/poseidon2b-nonlinear-subspace-reproduction-v1.1.0.md`.
Certificate revision: `5e6951555dd67d37ede40b6e272561cd7022089d` in
`https://github.com/ignotusnemo/parano1d-soundness`. Production revision:
`7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` in
`https://github.com/ignotusnemo/parano1d`.

## Required result

Run the repository verifier in release mode with its lockfile. Acceptance
requires the protected execution to reproduce the complete report digest,
rank core `0x0000000000000000000000000000be32`, trail lengths `2` and `4`,
and the lowest ePrint 2026/1792 projection `1022.830074998558` exactly.

## Work boundary

Do not change certificate code, expected values, contracts or verifier code.
Produce only the generated `submission.json`. The trusted verifier exports and
executes the pinned certificate itself, so copied numbers alone do not satisfy
the contract.

## Commands

Create the submission with `npm run challenge -- setup`, then run
`npm run challenge -- verify --submission <directory>`. A successful local
result must be `accepted`.

## Profile boundary

This is the historical v1 profile. Do not transfer its numerical result or a scoped acceptance audit to v2. The current v2 bank has separate tasks and evidence.
