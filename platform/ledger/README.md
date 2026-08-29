# Accepted evidence ledger

`ledger/accepted/` contains only derived `accepted-submission` records. Never hand-edit a record. The platform rebuilds public claims, frontier history and leaderboards from this directory together with the official baseline.

For a machine-accepted certificate reproduction that has been merged under `submissions/<id>/`, bind the exact pull request identity and generate its record with:

```sh
GITHUB_TOKEN=<token> npm run promote -- --submission submissions/<id> --repository ignotusnemo/parano1d-soundness --commit <verified-head-sha> --actor <pull-request-author> --pull-request <number>
npm run ledger:verify
```

Human-reviewed results use the approval-bound procedure in [`reviews/README.md`](../reviews/README.md). CI reconstructs every ledger record from the original submission, frozen contract, source commit and review decision. On trusted runs it also confirms the recorded GitHub approvals against the exact pull request commit.
