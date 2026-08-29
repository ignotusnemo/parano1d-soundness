# Verification contracts

Every research track has an exact acceptance contract. A contract defines the security game, the accepted artifact, the deterministic checks, the score direction and the only claim that an accepted result may change.

An active contract has an implemented verifier and may accept submissions. A draft contract is public for review, but cannot accept a result or change the soundness assessment. Human review decides whether a formal statement or executable model matches the intended Parano1d claim. The frozen verifier then checks the submitted artifact without executing contributor-controlled build scripts.

The three open cryptographic obligations currently remain draft contracts:

- [`adaptive-all-root-qrom-v0.1.0-draft.md`](adaptive-all-root-qrom-v0.1.0-draft.md)
- [`coherent-response-minimum-v0.1.0-draft.md`](coherent-response-minimum-v0.1.0-draft.md)
- [`poseidon2b-attack-v0.1.0-draft.md`](poseidon2b-attack-v0.1.0-draft.md)

No draft result is counted in the leaderboard or used to raise or lower the production conclusion.
