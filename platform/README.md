# Parano1d open verification platform

This directory contains the static website, public claim graph, research-track contracts, submission verifier and versioned evidence ledger published at [noid.network](https://noid.network/).

The website is a static Next.js export. GitHub Actions performs trusted verification and builds the complete public state. GitHub Pages only serves generated HTML, JavaScript, metadata and `data/state.json`; it holds no private key, database or server-side API.

## Local development

```sh
npm ci
npm run state:build
npm run dev
```

The production export is built with:

```sh
npm run typecheck
npm test
npm run build
```

Submission instructions are in [`docs/SUBMIT.md`](docs/SUBMIT.md). Exact draft contracts are in [`contracts/`](contracts/).
