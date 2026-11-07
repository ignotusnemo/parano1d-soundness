#!/usr/bin/env python3
"""Exact finite hypotheses for the RS grouped-restoration argument."""

import json
from fractions import Fraction
from pathlib import Path

from october_2026_checks import calculate_checks
from v21_certificate import checked


def theorem_hypotheses(domain, dimension, agreement, multiplicity):
    """Check m >= ceil(sqrt(rho)/(agreement-sqrt(rho))) without floats."""
    rho = Fraction(dimension - 1, domain)
    checked(0 < rho < 1 and 0 < agreement < 1, "RS parameter range")
    checked(multiplicity >= 3, "BCHKS multiplicity floor")
    johnson_margin = agreement**2 - rho
    multiplicity_margin = (multiplicity * agreement)**2 - (multiplicity + 1)**2 * rho
    checked(johnson_margin > 0, "strict Johnson agreement condition")
    checked(multiplicity_margin >= 0, "insufficient BCHKS multiplicity")
    checked(agreement * domain > dimension - 1, "agreement must determine a codeword")
    return {"johnsonMargin": str(johnson_margin), "multiplicityMargin": str(multiplicity_margin)}


def calculate(root):
    layers = calculate_checks(root)["johnsonLayers"]
    results = []
    for layer in layers:
        agreement = Fraction(layer["agreement"])
        # Authorization uses the fixed m=8 argument. Rate-one-quarter
        # families have agreement=(m+1)/(2m), which determines m exactly.
        selected = 8 if layer["family"] == "authorization" else 1 / (2 * agreement - 1)
        checked(Fraction(selected).denominator == 1, "integral selected multiplicity")
        multiplicity = int(selected)
        results.append({**layer, "multiplicity": multiplicity,
                        **theorem_hypotheses(layer["domain"], layer["dimension"], agreement, multiplicity)})
    checked(len(results) == 421, "complete authenticated layer inventory")
    return {"schemaVersion": 1, "productionCommit": "848209d5db75137483cb41a94b310ad11463473f",
            "theorem": "BCHKS TR25-169, Theorem 4.6, M=1",
            "primarySource": "https://eccc.weizmann.ac.il/report/2025/169/download",
            "checkedLayers": len(results), "layers": results,
            "proof": "docs/v2.1-rs-grouped-restoration.md",
            "scope": "Public-coin RS common-agreement and deterministic source restoration. Native-to-ideal adaptive composition uses the all-root compiler condition."}


if __name__ == "__main__":
    print(json.dumps(calculate(Path(__file__).resolve().parents[2]), sort_keys=True, indent=2))
