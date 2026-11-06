# V2.1 certificate reproduction contract v3.0.0

The target is the source-pinned conditional v2.1 joint-ancestry calculation. It covers Small, Large and Native, retains all twenty historical events and adds six current events.

Production revision: `848209d5db75137483cb41a94b310ad11463473f`. Certificate implementation: `7ead11a3afb452fb14eea505cfa913ce20a87f9a` in the public soundness repository. Report SHA-256: `ffabeeb286fc9263fb490a30804846ab34dca9e24515f6dc59df598525469183`.

The protected runner archives the trusted certificate commit and executes `python3 -I -B research/tools/v21_certificate.py --json` from that archive. It authenticates the runtime metadata and historical report, recomputes the current events, verifies exact max dominance and reconstructs the complete envelopes with rational arithmetic. Submitted code, packages and live working-tree input files supply no executable inputs.

Every field in `catalog/tracks/certificate-reproduction.json` must match, including separate production and certificate pins, profile hash, bank, predecessor, activation height 279370, three classes, 20 retained events, six added events and 26 total events.

Run `python3 research/tools/v21_certificate.py --json` independently. From `research`, prepare a submission with `npm run challenge -- setup --track certificate-reproduction --id my-reproduction`, then verify it with the public CLI. A matching result verifies reproducibility and the exact conditional calculation. The local extraction, RS-specific agreement, coupled compiler, fixed-hash, preprocessing and response-price conditions apply as stated in [the derivation](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7ead11a3afb452fb14eea505cfa913ce20a87f9a/docs/v2.1-certificate.md).

Acceptance creates a record for `v21-joint-bank-accounting` with no frontier metric. Historical contracts remain available for explicit accepted-ledger replay.
