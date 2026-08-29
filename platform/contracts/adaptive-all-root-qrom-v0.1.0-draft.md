# Adaptive all-root QROM contract v0.1.0 draft

## Target claim

The target is the `adaptive-all-root-qrom` obligation in the versioned claim graph. The required theorem concerns one stateful quantum adversary, one total oracle-query budget and all adaptively selected typed wallet and History roots represented in a single measured compressed-oracle database. The theorem must justify the all-root bound used in equation (11) of [`docs/category-one.md`](../../docs/category-one.md) without multiplying the failure probability by chain height, wallet count or the number of represented roots.

## Exact scope

The statement must include the typed statement-keyed namespaces, the `BadAll`, `MissRep` and `BadTypedBind` boundary events, adaptive selection of recursive parents, deterministic post-measurement ancestry extraction and the from-genesis terminal-State game. A proof of a single fixed root, a non-adaptive list of statements or an untyped random-oracle game does not satisfy this contract.

## Candidate artifact

The eventual active contract will accept a proof-assistant project with a pinned checker version, dependency lock, named top-level theorem and a machine-readable manifest that binds the theorem to the exact game revision. The artifact must contain no admitted goals, unsafe declarations or undeclared axioms. All allowed axioms and external theorem imports must be listed explicitly.

## Trusted verifier

Activation requires two independent checks. The first builds the submitted proof with the pinned toolchain in an unprivileged environment. The second replays the compiled proof object through the proof assistant's small trusted kernel and emits the complete axiom inventory. CI must compare the theorem type and game digest against the frozen contract before recording a result.

## Human review boundary

Machine checking proves that an artifact establishes its formal theorem. It does not prove that the formal theorem faithfully represents the Parano1d security game. Before contract activation, at least one cryptographic reviewer and one production-correspondence reviewer must approve that mapping. Those approvals are versioned evidence and become invalid if the game statement changes.

## Effect of an accepted result

A proof of the exact theorem may change only `adaptive-all-root-qrom` from `open` to `verified`. A valid counterexample to the exact theorem may change only that claim to `refuted`. Neither result may modify the fixed Poseidon2b delta or coherent response-cost claims.

## Activation blockers

- Select and pin a proof assistant with adequate quantum random-oracle formalization support.
- Freeze the formal game and equation (11) theorem type.
- Freeze the dependency and axiom allowlists.
- Implement independent kernel replay and theorem-type digest checks.
- Obtain the two correspondence approvals described above.
