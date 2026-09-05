# Certificate reproduction contract v1.1.0

## Published target

The target is the exact Parano1d soundness calculator at certificate revision `e45cfefd0632ed48d9f2f1975bf5174b5356a37c` and production revision `7f65daaae414128aa4377ca0ac1e96fd6dbc31a5`.

## Accepted work

The trusted verifier checks the protected certificate tree, runs the locked release calculator and compares the exact report digest and every frozen result. Contributor-controlled code is never executed. A matching reproduction demonstrates independent reproducibility and does not strengthen a security bound.

## Required values

The manifest contains the frozen certificate and production commits, report SHA-256, provable Block-Tiwari work, sequential ideal-QROM boundary, Category 1 gate-depth floor, complete ideal envelope and classical Poseidon2b projection. Every value must match the protected execution exactly.

## Effect

A successful run enters the reproducibility record and contributor leaderboard. It cannot change a theorem, premise, frontier or production conclusion.
