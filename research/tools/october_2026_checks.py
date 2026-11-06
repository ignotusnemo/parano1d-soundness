#!/usr/bin/env python3
"""Exact applicability checks prompted by the October 2026 literature review."""

import json
from fractions import Fraction
from pathlib import Path

from v21_certificate import HISTORY_MULTIPLICITY, calculate, checked, load_inputs


def layers(label, tail, initial, inverse_rate, agreement):
    result = []
    domain = tail
    while domain <= initial:
        dimension = domain // inverse_rate
        margin = agreement**2 - Fraction(dimension-1, domain)
        checked(margin > 0, f"Johnson condition failed for {label}/{domain}")
        result.append({"family":label, "domain":domain, "dimension":dimension,
                       "agreement":str(agreement), "squared_johnson_margin":str(margin)})
        domain *= 2
    checked(domain == 2*initial, "incomplete layer inventory")
    return result


def gf4_multiply(a, b):
    # F2[X]/(X^2+X+1), independently implemented for the small diagnostic.
    product = 0
    while b:
        if b & 1:
            product ^= a
        b >>= 1
        a <<= 1
        if a & 4:
            a ^= 7
    return product


def diagnostic_checks():
    # x^2=0 has a zero Jacobian but only x=0 satisfies it. A tangent
    # certificate must check the quadratic directional coefficient too.
    satisfying = [x for x in range(4) if gf4_multiply(x,x) == 0]
    tangent = list(range(4))
    line_directions = [v for v in tangent if gf4_multiply(v,v) == 0]
    checked(satisfying == [0] and tangent == [0,1,2,3] and line_directions == [0],
            "finite-field Jacobian diagnostic")
    # For xy=0 at the origin, the direction (1,0) gives a genuine line.
    points = [(t,0) for t in range(4)]
    checked(all(gf4_multiply(x,y) == 0 for x,y in points), "positive line certificate")
    return {"field":"GF(4)", "equation":"x^2=0", "satisfying_values":satisfying,
            "jacobian_tangent_values":tangent, "certified_line_directions":line_directions,
            "positive_control_xy_zero_points":points}


def calculate_checks(root):
    profile, ancestry, _ = load_inputs(root)
    result = calculate(root)
    all_layers = layers('authorization',512,65536,32,Fraction(1,5))
    m = HISTORY_MULTIPLICITY
    agreement = Fraction(m+1,2*m)
    for c in profile['classes']:
        p = c['pcs']
        all_layers += layers(f"v21.class-{c['class']}",p['plaintext_tail_len'],p['codeword_len'],4,agreement)
    # These authenticated domains retain the earlier sparse-matrix obligations.
    for index,key in enumerate(ancestry['retirement']):
        for c in key['columns']:
            all_layers += layers(f"retirement.{index}.column-{c['label']}",c['plaintext_tail_len'],2**c['codeword_log2'],c['inverse_rate'],Fraction(100001,200000))
    for c in ancestry['classes']:
        p = c['pcs']
        all_layers += layers(f"v2.class-{c['class']}",p['plaintext_tail_len'],2**p['codeword_log2'],p['inverse_rate'],agreement)
    for label,tail,initial in [('history.b25',128,2**19),('history.b255',512,2**21)]:
        all_layers += layers(label,tail,initial,4,agreement)
    # The finite-list improvement of 2026/2617 uses F_(L+1)(gamma) > 1-p.
    # Test the actual L=17 authorization candidate envelope at p=gamma=4/5.
    p = gamma = Fraction(4,5)
    list_size = 17
    gap = (1-gamma)**2 + (gamma+(1-gamma)*gamma**(list_size+1))/(list_size+1) - (1-p)
    checked(gap < 0, "generic finite-list MCA transfer unexpectedly applies")
    return {"schemaVersion":1, "productionCommit":profile['productionCommit'],
            "method":"exact rational layer checks and independent finite-field enumeration",
            "johnsonLayerCount":len(all_layers), "johnsonLayers":all_layers,
            "genericMcaTransfer":{"paper":"2026/2617", "listRadius":str(p),
               "requestedMcaRadius":str(gamma), "listBound":list_size,
               "finiteListGap":str(gap), "positiveGapCondition":False,
               "requiredCondition":"RS-specific grouped agreement and source restoration"},
            "jacobianDiagnostic":diagnostic_checks(),
            "queryBudget":{"adversarialPreprocessing":"charged", "verificationQueries":"charged",
               "sourceDependentPublicSetup":"honest authenticated preprocessing condition",
               "oracleDependentAdvice":"requires a separately quantified advice model"},
            "certificate":{"typedEvents":len(result['events']),"dominance":result['dominance']}}


if __name__ == '__main__':
    print(json.dumps(calculate_checks(Path(__file__).resolve().parents[2]),sort_keys=True,indent=2))
