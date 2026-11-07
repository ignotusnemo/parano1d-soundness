#!/usr/bin/env python3
"""Append maintainer cfg(test) audits to an isolated, exact production checkout."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

PRODUCTION = "848209d5db75137483cb41a94b310ad11463473f"
PATCHES = {
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/assembly.rs": "assembly_tests.rs",
    "noid_recursive/src/acceptance/history_step/gated_recorder.rs": "recorder_tests.rs",
    "noid_chain/src/storage/mdbx_context.rs": "state_tests.rs",
}


def install(production, audits):
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=production, text=True).strip()
    if revision != PRODUCTION:
        raise ValueError("audit checkout must have the exact published production revision")
    receipts = []
    for name, suffix_name in PATCHES.items():
        frozen = subprocess.check_output(["git", "show", f"{PRODUCTION}:{name}"], cwd=production)
        target = production / name
        suffix = (audits / suffix_name).read_bytes()
        if len(suffix) > 16000 or not suffix.startswith(b"\n#[cfg(test)]\nmod v21_closure_audit"):
            raise ValueError("unexpected maintainer audit module")
        if target.read_bytes() not in (frozen, frozen + suffix):
            raise ValueError(f"audit source already differs: {name}")
        target.write_bytes(frozen + suffix)
        receipts.append({"path": name, "productionSha256": hashlib.sha256(frozen).hexdigest(),
                         "auditModule": suffix_name, "auditSha256": hashlib.sha256(suffix).hexdigest(),
                         "compiledFileSha256": hashlib.sha256(frozen + suffix).hexdigest(),
                         "originalSourcePrefixUnchanged": True})
    return {"productionCommit": PRODUCTION, "method": "Exact production source with append-only cfg(test) audit modules", "sources": receipts}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--production", required=True, type=Path)
    parser.add_argument("--audits", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(install(args.production, args.audits), sort_keys=True, indent=2))
