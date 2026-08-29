# All-root theorem review and formalization contract v1.0.0

## Published target

The target is the published `adaptive-all-root-qrom` theorem in the pinned Parano1d soundness certificate. It covers one stateful quantum adversary, one total oracle-query budget and every adaptively selected typed wallet and History root represented in a single measured compressed-oracle database. The theorem gives the from-genesis all-root reduction without multiplying failure probability by chain height, wallet count or represented-root count.

## Accepted work

A submission may provide an independent derivation, a proof-assistant formalization, a precise strengthening, a semantic correspondence audit or a concrete counterexample. It must address the exact typed statement-keyed namespaces, `BadAll`, `MissRep`, `BadTypedBind`, adaptive recursive parents, deterministic post-measurement traversal and the terminal invalid-State game. A fixed-root or non-adaptive theorem is a different result.

## Submission

The PR contains `submission.json`, `report.md` and optionally one passive `artifact.json`. The manifest pins the production commit, certificate commit, target claim and file digests. The report must state the claimed effect, full assumptions, theorem or counterexample, primary sources and a reproducible artifact commit when one exists.

## Verification

CI validates the schema, source pins and report digest without executing contributor-controlled code. A maintainer checks production correspondence and an independent cryptographic reviewer checks the mathematical argument. A proof-assistant artifact additionally requires a pinned checker, complete axiom inventory, no admitted goals and independent kernel replay before it can be recorded as machine checked.

## Effect

Supporting evidence adds a versioned record without silently changing the theorem statement. A confirmed strengthening may replace the theorem only through an explicit contract revision. A confirmed counterexample marks the exact claim as challenged or refuted and recalculates dependent conclusions. Failed attack searches do not raise a bound.
