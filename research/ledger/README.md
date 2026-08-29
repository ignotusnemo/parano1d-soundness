# Accepted evidence ledger

`ledger/accepted/` contains only derived `accepted-submission` records. Never hand-edit a record. The public research tooling rebuilds claims, frontier history and leaderboards from this directory together with the official baseline.

After a machine-accepted certificate reproduction is merged under `submissions/<id>/`, the trusted GitHub workflow rechecks the exact passive pull request through the pre-merge verifier, derives its ledger record and verifies the complete ledger before publishing it. The equivalent recovery command is:

```sh
GITHUB_TOKEN=<token> npm run promote -- --submission submissions/<id> --repository ignotusnemo/parano1d-soundness --commit <verified-head-sha> --actor <pull-request-author> --pull-request <number>
npm run ledger:verify
```

Human-reviewed results use the approval-bound procedure in [`reviews/README.md`](../reviews/README.md). CI reconstructs every ledger record from the original submission, frozen contract, source commit and review decision. On trusted runs it also confirms the recorded GitHub approvals against the exact pull request commit.
