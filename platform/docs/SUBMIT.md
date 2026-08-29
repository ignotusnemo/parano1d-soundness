# Submitting a verification result

Every public contribution is a GitHub pull request against `ignotusnemo/parano1d-soundness`. The pull request must add exactly one directory under `platform/submissions/` and must not modify any existing file.

## Active tracks

The exact calculator reproduction track is machine checked. The production correspondence audit track checks its schema and source pins automatically, then requires confirmation from a maintainer and an independent reviewer. Draft cryptographic tracks do not yet accept results and cannot change the public conclusion.

## Directory format

Use a lowercase identifier containing letters, digits and hyphens. A machine-checked submission contains only `submission.json`. A production correspondence audit also contains `report.md`. The combined size limit is 1 MiB.

```text
platform/submissions/<submission-id>/submission.json
platform/submissions/<submission-id>/report.md
```

Start from an example in [`platform/submissions/examples`](../submissions/examples). The manifest identifier must equal the directory name and its contract version must exactly match the active track.

## Security boundary

The verifier reads the pull request files as passive data through the GitHub API. It does not check out or execute contributor-controlled code, actions, binaries, package manifests or build scripts. Identity, repository, commit and pull request number come from the trusted GitHub event rather than from the submission manifest.

## Promotion

A successful check proves only the statement defined by the selected track contract. Accepted evidence is verified again from the merged revision, assigned its contract-defined effects and written into the versioned public ledger. Derived conclusions and the leaderboard are rebuilt from that ledger.

For a draft contract, open a normal issue or pull request discussing the contract itself. Do not present a draft artifact as an accepted result.
