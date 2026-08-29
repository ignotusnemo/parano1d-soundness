# Verification contracts

Every research track has an exact acceptance contract. A contract defines the security game, accepted evidence, automated checks, semantic review, score direction and the only claim that an accepted result may change.

The exact calculator reproduction is machine checked. Cryptographic proofs, circuit results and attacks are source-pinned and schema-checked automatically, then reviewed by the experts named by their contracts. The trusted workflow never executes contributor-controlled code, actions, binaries, package manifests or build scripts.

The active public research contracts are:

- [`certificate-reproduction-v1.0.0.md`](certificate-reproduction-v1.0.0.md)
- [`adaptive-all-root-qrom-v1.0.0.md`](adaptive-all-root-qrom-v1.0.0.md)
- [`coherent-response-minimum-v1.0.0.md`](coherent-response-minimum-v1.0.0.md)
- [`poseidon2b-attack-v1.0.0.md`](poseidon2b-attack-v1.0.0.md)
- [`production-correspondence-v1.0.0.md`](production-correspondence-v1.0.0.md)

The certificate contract checks exact reproducibility. The all-root contract reviews or formalizes the published theorem. The coherent-response and Poseidon2b contracts expose the declared production premises to concrete attack and strengthening work, while the correspondence contract audits the mapping from production acceptance code to the theorem. A result enters the leaderboard only after every required check and review succeeds. A maintainer may accept a rigorous negative result because it has no claim effects. Results that change claims or frontiers retain the full independent review policy.

Accepted human review is not represented by an unchecked text label. The versioned review decision binds immutable GitHub approval URLs to the exact submission commit and verifier digest. CI verifies those approvals again and reconstructs the resulting ledger record before publication. Contradictory accepted evidence produces a visible `conflicted` claim and a crossed numerical interval produces a visible frontier conflict; chronological order never silently erases either contradiction.
