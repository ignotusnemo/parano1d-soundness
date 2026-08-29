# Accepted review decisions

Every human-reviewed ledger record has one decision in `reviews/accepted/<record-id>.json`. The decision binds the submission ID, exact pull request commit, automated verifier digest, acceptance time, contract-defined effects and the immutable GitHub URLs of every required approval.

The preparation command re-runs the passive verifier, binds its digest and creates a strict decision from the exact pull request context and approval URLs. Use repeated `--independent` options when the contract requires two independent reviewers. A result with frontier metrics supplies a strict JSON array through `--effects`; status-only reviews use the contract-derived default effect.

```sh
npm run review:prepare -- --submission submissions/<id> --repository ignotusnemo/parano1d-soundness --commit <head-sha> --actor <author> --pull-request <number> --maintainer 'ignotusnemo=<review-url>' --independent '<login>=<review-url>' --note '<accepted finding of at least 40 characters>' --output /tmp/<id>-decision.json
```

The promotion command checks the frozen review policy, confirms every GitHub approval against the exact submission commit and writes both the decision and derived ledger record. It rejects self-review, duplicated reviewers, stale approvals, an untrusted maintainer role, effects outside the target claim, claim statuses outside the track's finding-specific rules and metrics outside the contract allowlist. A reviewed component result may preserve a declared `premise` while adding an exact bound; it does not automatically prove or refute the end-to-end claim.

```sh
GITHUB_TOKEN=<token> npm run promote:reviewed -- --submission submissions/<id> --decision /path/to/review-decision.json
npm run ledger:verify -- --github
```

`GITHUB_TOKEN` is read from the environment and is never written into a decision or ledger file. The repository CI repeats ledger verification using its own read-only token. Mathematical and cryptanalytic judgment remains with the reviewers named by the frozen contract; automation proves that the recorded people approved the recorded commit and that the resulting public effects are exactly those reviewed.
