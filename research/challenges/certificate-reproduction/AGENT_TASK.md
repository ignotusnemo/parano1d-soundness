# Agent task: V2.1 certificate reproduction

Read `contracts/certificate-reproduction-v3.0.0.md` and the complete source-pinned research workspace. The production source is `848209d5db75137483cb41a94b310ad11463473f`. The exact certificate implementation is `7ead11a3afb452fb14eea505cfa913ce20a87f9a` in `ignotusnemo/parano1d-soundness`.

Run `python3 research/tools/v21_certificate.py --json` from the repository root. Authenticate the profile and input bytes, retain all twenty historical events, and check the six current events for Small, Large and Native. Compare every field of the exact output with the active frozen contract.

From `research`, prepare a passive submission with `npm run challenge -- setup --track certificate-reproduction --id my-reproduction`. Its only executable work is the trusted protected calculator. Submit `submission.json` with the exact generated source pair and payload. A reproduction adds an attributed evidence record with no frontier metric.

Read `docs/v2.1-certificate.md` and `docs/october-2026-security-review.md` for the numerical result, conditions and source-replay instructions. The current aggregate calculator uses Python standard-library rational arithmetic. The separate Poseidon2b component task executes the integrated production Rust calculator.
