# Accepted evidence ledger

`ledger/accepted/` contains only derived `accepted-submission` records. Never hand-edit a record. The public research tooling rebuilds claims, frontier history and leaderboards from this directory together with the official baseline.

After a machine-accepted certificate reproduction is proposed under `submissions/<id>/`, the noid.network backend rechecks the exact passive Forgejo pull request, runs the trusted repository suite, merges it, derives its ledger record and verifies the complete ledger before publishing it. The equivalent recovery command is:

```sh
npm run promote -- --submission submissions/<id> --repository ignotusnemo/parano1d-soundness --commit <verified-head-sha> --actor noid-network --pull-request <number>
npm run ledger:verify
```

Human-reviewed results use the approval-bound procedure in [`reviews/README.md`](../reviews/README.md). The backend reconstructs every ledger record from the original submission, frozen contract, source commit and review decision. It also confirms recorded Forgejo approvals against the exact pull request commit. Historical GitHub-backed records remain reproducible and may still be revalidated with the legacy verifier path.
