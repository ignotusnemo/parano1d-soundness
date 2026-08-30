# Agent task: reproduce the exact soundness certificate

## Objective

Independently execute the protected Parano1d soundness calculator at the pinned certificate and production commits and confirm every declared output. This track tests reproducibility. It does not move a security frontier.

## Pinned materials

Use `contracts/certificate-reproduction-v1.0.0.md`. Certificate revision: `c3ea3342fbe27111c84046613010f14f13b917c6` in `https://github.com/ignotusnemo/parano1d-soundness`. Production revision: `fedbe6e3c0ddf8b8372546017bb9bc341acb8ab0` in `https://github.com/ignotusnemo/parano1d`.

## Required result

Run the certificate through the repository verifier in release mode with its lockfile. The submission is accepted automatically only when the observed Block-Tiwari value, sequential ideal-QROM boundary, Category 1 gate-depth floor, complete ideal envelope and Poseidon2b classical projection all match the frozen contract exactly.

## Work boundary

Do not change calculator code, expected values, track contracts or verifier code. Produce only the generated `submission.json`. The trusted verifier checks out and executes the pinned certificate itself, so copying numbers without a successful protected execution gives no additional authority.

## Commands

Create the submission with `npm run challenge -- setup`, then run `npm run challenge -- verify --submission <directory>`. A successful local result must be `accepted`.
