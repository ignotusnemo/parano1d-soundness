# Verification contracts

Every research track has an exact acceptance contract. A contract defines the security game, accepted evidence, automated checks, semantic review, score direction and the only claim that an accepted result may change.

For local-account submissions on noid.network, the authenticated portal maintainer has final review authority through the existing signed service decision. This applies to pending and new hosted reviews; additional reviewers are advisory, not a prerequisite for Finalize. It supersedes reviewer-count wording in the versioned contracts only for that authenticated hosted route. Mathematical targets, source pins, evidence thresholds, allowed effects and existing signed records are unchanged. Legacy and external review decisions still use their recorded approval-count policy. See [review decisions](../reviews/README.md).

The exact calculator reproduction is machine checked. Cryptographic proofs, circuit results and attacks are source-pinned and schema-checked automatically, then reviewed by the experts named by their contracts. The trusted workflow never executes contributor-controlled code, actions, binaries, package manifests or build scripts.

All active public research contracts target the pinned v2.0.3 production source:

- [V2 certificate reproduction](certificate-reproduction-v2.0.0.md)
- [V2 coherent response circuit challenge](coherent-response-minimum-v2.0.0.md)
- [V2 production Poseidon2b attack](poseidon2b-attack-v2.0.0.md)
- [V2 Poseidon2b nonlinear-subspace reproduction](poseidon2b-nonlinear-subspace-reproduction-v2.0.0.md)
- [V2 production correspondence audit](production-correspondence-v2.0.0.md)
- [V2 all-root composition review](adaptive-all-root-qrom-v2.0.0.md)
- [V2 recursive Fiat-Shamir audit](v2-recursive-fiat-shamir-audit-v1.0.0.md)
- [V2 sparse-retirement binding audit](v2-retirement-binding-audit-v1.0.0.md)

The certificate contracts check exact reproducibility. The nonlinear-subspace reproduction is a narrow machine-checked audit record and cannot move the frontier. The all-root contract reviews or formalizes the published theorem. The coherent-response contract exposes the exact production relation and resource model to circuit work, while the correspondence contract audits the mapping from production acceptance code to the theorem. Those scoped review tracks may retain a rigorous negative result with no claim effects after maintainer review. The Poseidon2b hosted agent path is intentionally stricter: only a conclusive reachable production result or fixed-compiler bound may create a public submission. A hosted result below that threshold closes as a private `no-result` and never enters a pull request, ledger or leaderboard. A reviewer may still downgrade a manually authored overclaim to `inconclusive`, which preserves the audit record but cannot affect a claim or frontier. Results that change claims or frontiers retain the full independent review policy.

Accepted human review is not represented by an unchecked text label. The versioned review decision binds immutable approval records to the exact submission commit and verifier digest. The noid.network backend verifies those approvals again, reconstructs the resulting ledger record and runs the trusted suite before publication. Contradictory accepted evidence produces a visible `conflicted` claim and a crossed numerical interval produces a visible frontier conflict; chronological order never silently erases either contradiction.
