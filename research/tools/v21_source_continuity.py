#!/usr/bin/env python3
"""Compare the accepted source-proof manifest with the published v2.1 source."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from v21_certificate import PRODUCTION, checked


def calculate(root, production):
    previous = "50d6dac5a37b9f1be425b5e6cd823de48f843b50"
    manifest = json.loads((root / "research/evidence/artifacts/2026-10-08-correspondence/source-manifest.json").read_text())
    checked(manifest["productionCommit"] == previous, "original proof source pin")
    sources = []
    for entry in manifest["sources"]:
        name = entry["path"]
        before = subprocess.check_output(["git", "show", f"{previous}:{name}"], cwd=production)
        after = subprocess.check_output(["git", "show", f"{PRODUCTION}:{name}"], cwd=production)
        old_hash = hashlib.sha256(before).hexdigest()
        checked(old_hash == entry["sha256"], f"original source receipt: {name}")
        sources.append({"path": name, "oldSha256": old_hash,
                        "newSha256": hashlib.sha256(after).hexdigest(), "identical": before == after})
    return {"schemaVersion": 1, "previousProductionCommit": previous,
            "productionCommit": PRODUCTION, "sources": sources,
            "interpretation": "Identical files retain their source arguments under the original hypotheses. Changed files require a separate delta argument. This receipt grants no broader claim effect."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--production", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(calculate(Path(__file__).resolve().parents[2], args.production), sort_keys=True, indent=2))
