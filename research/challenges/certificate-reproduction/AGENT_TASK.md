# Agent task: reproduce the exact soundness certificate

## Objective

Independently execute the protected Parano1d soundness calculator at the pinned certificate and production commits and confirm every declared output. This track tests reproducibility. It does not move a security frontier.

## Pinned materials

Use `contracts/certificate-reproduction-v1.3.0.md`. Certificate revision: `5e6951555dd67d37ede40b6e272561cd7022089d` in `https://git.parano1d.org/ignotusnemo/parano1d-soundness`. Production revision: `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5` in `https://git.parano1d.org/ignotusnemo/parano1d`.

## Required result

Run the certificate through the repository verifier in release mode with its lockfile. The submission is accepted automatically only when the observed Block-Tiwari value, sequential ideal-QROM boundary, Category 1 gate-depth floor, complete ideal envelope and Poseidon2b classical projection all match the frozen contract exactly.

## Work boundary

Do not change calculator code, expected values, track contracts or verifier code. Produce only the generated `submission.json`. The trusted verifier checks out and executes the pinned certificate itself, so copying numbers without a successful protected execution gives no additional authority.

## Commands

Create the submission with `npm run challenge -- setup`, then run `npm run challenge -- verify --submission <directory>`. A successful local result must be `accepted`.

## Profile boundary

This is the historical v1 profile. Do not transfer its numerical result or a scoped acceptance audit to v2. The current v2 bank has separate tasks and evidence.
