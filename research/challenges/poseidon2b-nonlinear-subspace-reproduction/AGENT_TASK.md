# Agent task: v2 poseidon2b nonlinear-subspace reproduction

## Objective

The target is the nonlinear-subspace specialization of ePrint 2026/1792 computed directly from the Poseidon2b parameters and matrices shipped in v2.0.3. The integrated `noid_soundness` binary reads the production crate; this contract hashes only its complete `POSEIDON2B NONLINEAR SUBSPACE REVIEW` section, including all four exact Macaulay projections.

## Pinned materials

Read `contracts/poseidon2b-nonlinear-subspace-reproduction-v2.0.0.md` and `certificates/README.md`. Production and integrated certificate are pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Obtain the complete production checkout and inspect the relevant code before executing the protected reproduction. This research workspace supplies the frozen contract, verified input files and passive verifier.

## Required result

The protected runner executes the current production `noid_soundness` binary with `--exact`, extracts exactly one complete nonlinear-subspace section and checks its SHA-256, rank core, trail lengths and lowest projected attack cost. Other sections of that binary retain a historical aggregate profile and are excluded from this component contract. The joint-bank v2 result is checked by the separate current certificate reproduction task.

## Commands and output

Set `PARANO1D_PRODUCTION_DIR` as documented in `certificates/README.md`. From the research directory, run `npm ci`, create a workspace with `npm run challenge -- setup --track poseidon2b-nonlinear-subspace-reproduction --id <your-result> <your attribution options>`, then run `npm run challenge -- verify --submission <directory>`. Return the generated passive `submission.json` only after the local verifier returns `accepted`.

Do not modify calculator sources, expected values, input files, contracts or verifier code. An altered field, source pin or input digest must fail. The nonzero core is `0000000000000000000000000000be32`, trail lengths are two and four, and the lowest semi-regular projection is `1022.830074998558` bits. This is a scoped component calculation, not a 1022-bit security claim, a universal lower bound or a production reachability witness.
