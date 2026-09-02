# Verification contracts

Every research track has an exact acceptance contract. A contract defines the security game, accepted evidence, automated checks, semantic review, score direction and the only claim that an accepted result may change.

The exact calculator reproduction is machine checked. Cryptographic proofs, circuit results and attacks are source-pinned and schema-checked automatically, then reviewed by the experts named by their contracts. The trusted workflow never executes contributor-controlled code, actions, binaries, package manifests or build scripts.

The active public research contracts are:

- [`certificate-reproduction-v1.0.0.md`](certificate-reproduction-v1.0.0.md)
- [`poseidon2b-nonlinear-subspace-reproduction-v1.0.0.md`](poseidon2b-nonlinear-subspace-reproduction-v1.0.0.md)
- [`adaptive-all-root-qrom-v1.0.0.md`](adaptive-all-root-qrom-v1.0.0.md)
- [`coherent-response-minimum-v1.0.0.md`](coherent-response-minimum-v1.0.0.md)
- [`poseidon2b-attack-v1.1.0.md`](poseidon2b-attack-v1.1.0.md) is the active production-impact contract.
- [`poseidon2b-attack-v1.0.0.md`](poseidon2b-attack-v1.0.0.md) is retained for historical submissions.
- [`production-correspondence-v1.0.0.md`](production-correspondence-v1.0.0.md)

The certificate contracts check exact reproducibility. The nonlinear-subspace reproduction is a narrow machine-checked audit record and cannot move the frontier. The all-root contract reviews or formalizes the published theorem. The coherent-response contract exposes the exact production relation and resource model to circuit work, while the correspondence contract audits the mapping from production acceptance code to the theorem. Those scoped review tracks may retain a rigorous negative result with no claim effects after maintainer review. The Poseidon2b hosted agent path is intentionally stricter: only a conclusive reachable production result or fixed-compiler bound may create a public submission. A hosted result below that threshold closes as a private `no-result` and never enters a pull request, ledger or leaderboard. A reviewer may still downgrade a manually authored overclaim to `inconclusive`, which preserves the audit record but cannot affect a claim or frontier. Results that change claims or frontiers retain the full independent review policy.

Accepted human review is not represented by an unchecked text label. The versioned review decision binds immutable GitHub approval URLs to the exact submission commit and verifier digest. CI verifies those approvals again and reconstructs the resulting ledger record before publication. Contradictory accepted evidence produces a visible `conflicted` claim and a crossed numerical interval produces a visible frontier conflict; chronological order never silently erases either contradiction.
