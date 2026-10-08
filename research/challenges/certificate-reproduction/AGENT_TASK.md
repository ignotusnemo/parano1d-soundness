# Agent task: v2 certificate reproduction

## Objective

The target is the complete source-linked v2.0.3 joint-bank accounting report. It covers wallet, pre-activation History, v2 History and sparse retirement, using the authenticated mainnet bank and two pinned retirement keys.

## Pinned materials

Read `contracts/certificate-reproduction-v2.0.0.md` and `certificates/README.md`. Production and integrated certificate are pinned to `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Obtain the complete production checkout and inspect the relevant code before executing the protected reproduction. This research workspace supplies the frozen contract, verified input files and passive verifier.

## Required result

The protected runner verifies the SHA-256 and exact size of all four decompressed inputs, then the production calculator independently verifies their protocol digests and key identities. It checks the complete JSON report hash, activation height 210537, 20-event inventory, bank, runtime and key pins, sequential query cap, limiting event, descriptive gate-depth floor and 90-digit ideal-envelope ceiling.

## Commands and output

Set `PARANO1D_PRODUCTION_DIR` as documented in `certificates/README.md`. From the research directory, run `npm ci`, create a workspace with `npm run challenge -- setup --track certificate-reproduction --id <your-result> <your attribution options>`, then run `npm run challenge -- verify --submission <directory>`. Return the generated passive `submission.json` only after the local verifier returns `accepted`.

Do not modify calculator sources, expected values, input files, contracts or verifier code. An altered field, source pin or input digest must fail. A matching result verifies conditional arithmetic and reproducibility. It does not independently regenerate the release matrices or prove honest preprocessing, all-root composition, the concrete compiler, fixed Poseidon2b deviation or universal response-cost minima. Those conditions have separate current v2 review tasks.
