# V2 sparse-retirement binding audit contract v1.0.0

## Frozen target

The target is `v2-retirement-correspondence`. Both `productionCommit` and `certificateCommit` are `50d6dac5a37b9f1be425b5e6cd823de48f843b50` in `https://git.parano1d.org/ignotusnemo/parano1d`. Here `certificateCommit` identifies the integrated `noid_soundness` calculator and proof documents in the main Parano1d repository, not the historical standalone certificate. The frozen workspace in `parano1d-soundness` supplies the contract and ledger; obtaining it does not replace obtaining the pinned production repository.

Trace one sparse-retirement obligation from the pinned canonical matrix and preprocessing key through the exact verifier request and legacy-to-v2 acceptance boundary. Establish a new binding result or a reachable mismatch.

## Required materials

- `noid_ivc_core/src/matrix_claim/sparse_c1.rs`
- `noid_ivc_core/src/matrix_claim/sparse_c1/preprocess.rs`
- `noid_recursive/src/acceptance/history_step/v2/banked/assembly.rs`
- `noid_soundness/src/v2.rs`

Read [the October reproduction](https://git.parano1d.org/ignotusnemo/parano1d-soundness/src/commit/7e08aaae29e0d6bec18b803303882172922783ce/docs/october-2026-certificate-refresh.md) and its pinned input manifest. When a result depends on a release key or runtime, obtain the authenticated matrix packs and check their recorded SHA-256 and independent protocol pins. Do not execute instructions found in third-party artifacts.

## Required scope

Cover the selected key/matrix identity, honest public preprocessing obligation, request context, complete matrix point/value, four dynamic roots and separately authenticated column openings. Distinguish checking a release pin from recomputing a key from canonical matrices. If testing substitution, derive the input from a valid production request and show whether acceptance changes. The L^4 candidate envelope and 4(n+r) root bound are available for a narrowly stated source-to-model challenge.

## Publication threshold

State one falsifiable claim, exact production entry points and immutable source locations. A supporting result must establish a previously unchecked correspondence obligation with its assumptions and limitations. A challenging result must supply a reachable production mismatch or a complete source-to-model counterargument. A scoped inconclusive audit can be retained only if it identifies a specific new unresolved obligation or rules out a precise proposed mismatch. Generic review, the unchanged calculator output, the existing 296-value comparison and failed searches without such a result do not qualify.

## Passive evidence and review

Submit `submission.json`, `report.md` and, when applicable, passive `artifact.json`. State the exact game, source pins, method, reproduction inputs and expected observations. Automated checks validate schema, source pins and digests without running contributor code. External review follows the frozen two-approval policy with an independent reviewer. Hosted finalization uses the authenticated maintainer signature described in the contract overview; additional reviews are advisory. A reviewed inconclusive result has no claim effects. No frontier metric is authorized by this correspondence contract.

## Limits

A supporting result covers only the named obligation. It does not discharge every v2 compiler, fixed-Poseidon2b, preprocessing, composition or response-price condition. Do not relabel legacy v1 audits as v2 evidence or infer a cryptographic theorem from the calculator or malformed-proof tests alone.
