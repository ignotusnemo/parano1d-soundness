#!/usr/bin/env python3
"""Exact checks for charged ideal accounting and resource-aware fixed lifting."""

import hashlib
import json
from fractions import Fraction
from pathlib import Path

from v21_certificate import SCALAR_GATES, SCALAR_PRICE, calculate as certificate, checked


def fixed_lift(state_probability, compiler_probability, envelope, delta):
    checked(0 <= state_probability <= compiler_probability <= 1, "all-root event inclusion")
    checked(envelope >= 0 and delta >= 0, "nonnegative envelope and deviation")
    excess = max(Fraction(0), compiler_probability - envelope)
    checked(delta >= excess, "fixed-event deviation must include the complete actual-budget excess")
    checked(state_probability <= envelope + delta, "production lifting inequality")
    return excess


def charge_schedule(batches, prices, scalar_gate_charge, total_gates, total_depth):
    checked(scalar_gate_charge > 0 and all(c > 0 for c in prices), "positive ideal prices")
    checked(total_gates >= 0 and total_depth >= 0, "nonnegative total budgets")
    checked(sum(a for a, _, _ in batches) <= total_gates, "total charged gates")
    checked(sum(d for _, d, _ in batches) <= total_depth, "total charged depth")
    responses = 0
    for gates, depth, counts in batches:
        checked(gates >= 0 and depth >= 0 and all(k >= 0 for k in counts), "nonnegative schedule")
        checked(len(counts) == len(prices), "complete typed response inventory")
        checked(sum(c*k for c,k in zip(prices,counts)) <= gates*depth, "batch price inequality")
        responses += sum(counts)
    checked(responses <= total_gates // scalar_gate_charge, "total response support charge")
    return responses


def calculate(root):
    result = certificate(root)
    envelope = Fraction(result['category_one_ideal_envelope']['exact'])
    headroom = Fraction(result['fixed_poseidon2b_delta_headroom']['exact'])
    checked(envelope + headroom == Fraction(1,2), "exact fixed-event headroom")
    for point in result['evaluated_resource_envelopes']:
        checked(Fraction(point['total']['exact']) <= envelope, "every declared MAXDEPTH point")
    # This example deliberately includes a fixed-circuit success probability
    # above the priced ideal envelope. The excess stays in the fixed boundary.
    fixed_probability = Fraction(3,4)
    excess = fixed_lift(fixed_probability,fixed_probability,envelope,fixed_probability-envelope)
    source = (root/'docs/category-one.md').read_bytes()
    checked(b'Pr[\\mathsf{BadCompiler}]_{\\rm fixed\\ P2b}' in source,
            "published fixed-event definition is the actual fixed game")
    checked(b'\\varepsilon_{\\rm ideal}(R)' in source, "published resource-envelope baseline")
    return {"schemaVersion":1, "productionCommit":result['production_commit'],
            "publishedDefinitionSha256":hashlib.sha256(source).hexdigest(),
            "proof":"docs/v2.1-resource-closure.md", "events":len(result['events']),
            "scalarGateCharge":SCALAR_GATES,"scalarGateDepthPrice":SCALAR_PRICE,
            "idealEnvelope":str(envelope),"fixedEventHeadroom":str(headroom),
            "fixedShortcutExample":{"actualCompilerProbability":"3/4","requiredDeviation":str(excess),
                                    "insideHalfSuccessHeadroom":excess < headroom},
            "productionPremises":["v21-all-root-composition","v21-fixed-poseidon2b-delta"],
            "resourceScope":"Complete charged ideal envelope. Fixed-event deviation is quantified over all adversaries in the declared actual logical resource envelope, with the published preprocessing and advice policy."}


if __name__ == '__main__':
    print(json.dumps(calculate(Path(__file__).resolve().parents[2]),sort_keys=True,indent=2))
