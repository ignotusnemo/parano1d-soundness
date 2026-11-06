#!/usr/bin/env python3
"""Exact source-pinned extension of the mainnet ancestry certificate to v2.1.

The six new typed events are recomputed. Every historical event is retained.
All probability and resource comparisons use integers and Fraction.
"""

import argparse
import copy
import gzip
import io
import hashlib
import json
import math
from decimal import Decimal, localcontext
from fractions import Fraction
from pathlib import Path

PRODUCTION = "848209d5db75137483cb41a94b310ad11463473f"
BANK = "6c280ae869afc25e31d46d73b42870512991b78c9498bc7e5ef939bc07e5ed5e"
METADATA_SHA256 = "549c1e23d1fdca9579dd12d571992a5416f6e8e2c250b7dfa21e81ea4e31cdd8"
ARCHIVE_SHA256 = "bbf76ff032181d1cce204f8efe52f437f47aa9cf686b5b5c6a2560c4650233ef"
ANCESTRY_SHA256 = "f99af13256d02f4cbd6554367a234725fc551806a163624e4cc892ccf0abbebd"
HISTORY_MULTIPLICITY = 318_983
SCALAR_GATES = 17_648_280
SCALAR_DEPTH = 11_352
SCALAR_PRICE = SCALAR_GATES * SCALAR_DEPTH
ANCESTRY_EVENTS = {
    "wallet.query", "wallet.field", "history.query", "history.b25.proximity",
    "history.b255.proximity", "history.candidate-switching", "history.joint-sidecar",
    "v2.query", "v2.small.proximity", "v2.large.proximity", "v2.candidate-switching",
    "v2.joint-sidecar", "retirement.b25.query", "retirement.b25.proximity",
    "retirement.b25.pcs-scalar", "retirement.b25.reduction", "retirement.b255.query",
    "retirement.b255.proximity", "retirement.b255.pcs-scalar", "retirement.b255.reduction",
}


def checked(condition, message):
    if not condition:
        raise ValueError(message)


def exact(value):
    return Fraction(value["exact"] if isinstance(value, dict) else value)


def upper_decimal(value, digits=90):
    n, d = value.numerator, value.denominator
    q = (n * 10 ** digits + d - 1) // d
    whole, fractional = divmod(q, 10 ** digits)
    return f"{whole}.{fractional:0{digits}d}"


def probability(value):
    return {"exact": str(value), "upper_decimal": upper_decimal(value)}


def descriptive_bits(value):
    with localcontext() as context:
        context.prec = 90
        number = Decimal(value.numerator) / Decimal(value.denominator)
        return format(number.ln() / Decimal(2).ln(), ".13f")


def load_inputs(root):
    directory = root / "research/certificates/v2.1.0"
    raw_profile = (directory / "profile.json").read_bytes()
    profile = json.loads(raw_profile)
    checked(profile["schemaVersion"] == 1, "profile schema")
    checked(profile["productionCommit"] == PRODUCTION, "published production revision")
    checked(profile["bankDigest"] == BANK, "published v2.1 bank")
    checked(profile["activationHeight"] == 279_370, "authorization activation")
    checked((profile["challengeBits"], profile["digestBits"], profile["historyQueries"]) == (255, 256, 133), "challenge and query profile")
    checked((profile["historyMaximumAlgebraicRoots"], profile["historyJointSidecarRoots"], profile["historyJointC1Groups"]) == (127, 36, 9), "algebraic degree inventory")
    checked(profile["authorizationLayout"] == {"version":"V4", "bankCells":2048, "libraCells":432, "terminalOffset":944, "terminalPadGroups":2, "terminalPadCells":10}, "current authorization layout")
    checked(profile["metadata"]["file"] == "v21-runtime-metadata.bin.gz", "protected metadata filename")
    checked(profile["metadata"]["releaseArchiveSha256"] == ARCHIVE_SHA256, "published release archive")
    checked(profile["metadata"]["bytes"] == 3_396_424, "declared metadata size")
    checked(profile["ancestryReport"]["file"] == "research/evidence/artifacts/2026-10-13/v2-soundness-mainnet.json", "protected ancestry filename")
    compressed = (directory / profile["metadata"]["file"]).read_bytes()
    checked(len(compressed) <= 1_048_576, "compressed metadata limit")
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        metadata = stream.read(3_396_425)
    checked(len(metadata) == 3_396_424, "metadata size")
    checked(hashlib.sha256(metadata).hexdigest() == METADATA_SHA256, "authenticated runtime metadata")
    checked(profile["metadata"]["sha256"] == METADATA_SHA256, "metadata manifest")
    checked(metadata[:8] == b"O1V21BN1" and int.from_bytes(metadata[104:108], 'little') == len(metadata)-108, "canonical metadata framing")
    raw_ancestry = (root / profile["ancestryReport"]["file"]).read_bytes()
    checked(hashlib.sha256(raw_ancestry).hexdigest() == ANCESTRY_SHA256, "authenticated historical report")
    checked(profile["ancestryReport"]["sha256"] == ANCESTRY_SHA256, "historical report manifest")
    ancestry = json.loads(raw_ancestry)
    checked(profile["predecessorBankDigest"] == ancestry["bank"], "retained predecessor bank")
    checked(profile["legacyRuntimeDigest"] == ancestry["legacy_runtime"], "retained legacy ancestry")
    classes = profile["classes"]
    checked([c["class"] for c in classes] == [0, 1, 2], "complete three-class inventory")
    checked([c["pages"] for c in classes] == [63, 206, 63], "selected class capacities")
    checked([c["outer_m"] for c in classes] == [23, 24, 24], "selected matrix shapes")
    for c in classes:
        p = c["pcs"]
        checked(c["matrix_digest"] == metadata[8+32*c["class"]:40+32*c["class"]].hex(), "matrix identity from authenticated metadata")
        checked(c["shape"] == {"m":c["outer_m"], "k_log":c["outer_m"], "k_skip":6, "const_pin":0}, "class matrix shape")
        checked(p["message_log2"] == c["outer_m"] - 5, "per-lane message geometry")
        checked(p["codeword_log2"] == p["message_log2"] + 2, "rate-one-quarter code")
        checked(p["codeword_len"] == 1 << p["codeword_log2"], "codeword domain")
        checked(p["inverse_rate"] == 4 and p["log_batch_size"] == 5 and p["log_inv_rate"] == 2, "PCS rate and batching")
        checked(p["plaintext_tail_len"] == (256 if c["class"] == 0 else 512), "plaintext tail")
        checked(p["fri_arities"] == ([4,4,4,4,2] if c["class"] == 0 else [4,4,4,4,3]), "fold schedule")
    wallet = profile["wallet"]
    checked((wallet["query_count"], wallet["miss_numerator"], wallet["miss_denominator"], wallet["field_bad_numerator"], wallet["field_denominator_bits"], wallet["candidate_pairs"], wallet["owner_bad_roots"]) == (65, "1", "5", "701202001931", 255, 289, "110"), "current authorization ledger")
    checked(exact(next(e for e in ancestry["events"] if e["id"] == "wallet.query")["bad_density"]) == Fraction(1,5) ** 65, "retained wallet query envelope")
    checked(exact(next(e for e in ancestry["events"] if e["id"] == "wallet.field")["bad_density"]) == Fraction(701_202_001_931, 2 ** 255), "retained wallet field envelope")
    return profile, ancestry, hashlib.sha256(raw_profile).hexdigest()


def proximity(domain, multiplicity):
    h = Fraction(2 * multiplicity + 1, 2)
    gamma = Fraction(multiplicity - 1, 2 * multiplicity)
    s = Fraction(domain - 4, 2 * domain)
    bound = domain * (2 * h ** 5 + 3 * h * gamma * s ** 2) / (3 * s ** 3) + h / s
    return Fraction(bound.numerator // bound.denominator, 2 ** 255)


def history_terms(profile):
    m = HISTORY_MULTIPLICITY
    classes, initial_lists = [], []
    for c in profile["classes"]:
        p = c["pcs"]
        n = p["codeword_len"]
        domain, values = p["plaintext_tail_len"], []
        while domain <= n:
            values.append(proximity(domain, m))
            domain *= 2
        checked(domain == 2*n, "complete proximity layer inventory")
        initial_lists.append(((2*m+1)*n-1)//(n-4))
        classes.append((c["class"], max(values)))
    bound = max(initial_lists)
    terms = {"v21.query": Fraction(m+1,2*m) ** profile["historyQueries"]}
    for (identifier, value), label in zip(classes, ["small", "large", "native"]):
        terms[f"v21.{label}.proximity"] = value
    terms["v21.candidate-switching"] = Fraction(bound * profile["historyMaximumAlgebraicRoots"], 2**255)
    terms["v21.joint-sidecar"] = Fraction(bound * profile["historyJointSidecarRoots"], 2**255)
    squeezes = []
    for c in profile["classes"]:
        per_lane = 128 // c["pcs"]["codeword_log2"]
        lanes = (profile["historyQueries"] + per_lane - 1) // per_lane
        squeezes.append((lanes + 1)//2)
    return terms, min(squeezes), initial_lists


def ceil_sqrt(value):
    root = math.isqrt(value)
    return root if root*root == value else root+1


def resource_envelope(maximum, depth_bits):
    query_cap = (1 << (170-depth_bits)) // SCALAR_GATES
    main = 10 * 2**170 * maximum
    finite = Fraction(10 * 2**170 * (2*query_cap+1), SCALAR_PRICE * 2**255)
    weighted = query_cap * 2**170
    root = ceil_sqrt((20*weighted + SCALAR_PRICE - 1)//SCALAR_PRICE)
    collision = Fraction(40*2719**2*weighted + 4*2719*1000*root*SCALAR_PRICE + 2*1000**2*SCALAR_PRICE, 1000**2*SCALAR_PRICE*2**256)
    return {"depth_bits":depth_bits, "database_query_cap":str(query_cap), "main":probability(main), "typed_finite":probability(finite), "global_collision":probability(collision), "total":probability(main+finite+collision)}


def ideal_bound(queries, kappa):
    return min(Fraction(1), 6*queries**2*(kappa+Fraction(2*queries+1,2**255))+Fraction(6*queries**3,2**256))


def calculate(root):
    profile, ancestry, profile_hash = load_inputs(root)
    events = copy.deepcopy(ancestry["events"])
    checked(len(events) == 20 and {e["id"] for e in events} == ANCESTRY_EVENTS, "every historical typed event must remain present")
    for event in events:
        checked(exact(event["density_per_gate_depth"]) == exact(event["bad_density"])/int(event["response_gate_depth_price"]), "historical resource ratio")
    terms, query_permutations, lists = history_terms(profile)
    for identifier, density in terms.items():
        price = SCALAR_PRICE * (query_permutations**2 if identifier.endswith(".query") else 1)
        events.append({"id":identifier, "bad_density":probability(density), "response_gate_depth_price":str(price), "density_per_gate_depth":probability(density/price)})
    checked(len(events) == 26 and len({e["id"] for e in events}) == 26, "complete joint event inventory")
    old_maximum = max(exact(e["density_per_gate_depth"]) for e in ancestry["events"])
    maximum = max(exact(e["density_per_gate_depth"]) for e in events)
    checked(maximum == old_maximum, "new events exceed the established resource envelope")
    kappa = max(exact(ancestry["sequential_local_rbr"]), *terms.values())
    checked(kappa == exact(ancestry["sequential_local_rbr"]), "new events exceed the established sequential envelope")
    floor = 1/(20*maximum)
    checked(floor == exact(ancestry["resource_work_floor_exact"]), "dominant floor correspondence")
    envelopes = [resource_envelope(maximum,d) for d in [40,64,96]]
    worst = max(envelopes,key=lambda e:exact(e["total"]))
    total = exact(worst["total"])
    checked(total == exact(ancestry["category_one_ideal_envelope"]), "independent exact resource reconstruction")
    sequential = ideal_bound(2**64,kappa)
    checked(sequential == exact(ancestry["sequential_at_two_to_64"]), "independent exact QROM reconstruction")
    query_cap = int(ancestry["sequential_largest_query_cap"])
    checked(ideal_bound(query_cap,kappa) < Fraction(1,2) <= ideal_bound(query_cap+1,kappa), "maximal integer sequential boundary")
    checked(total < Fraction(1,2) and floor > 2**170, "conditional Category 1 inequalities")
    events.sort(key=lambda e:(-exact(e["density_per_gate_depth"]),e["id"]))
    return {
        "schema_version":1, "profile":"mainnet-v21", "production_commit":PRODUCTION,
        "bank":BANK, "predecessor_bank":profile["predecessorBankDigest"], "legacy_runtime":profile["legacyRuntimeDigest"],
        "activation_height":profile["activationHeight"], "class_count":3, "classes":profile["classes"],
        "wallet":profile["wallet"], "authorization_layout":profile["authorizationLayout"],
        "profile_sha256":profile_hash, "ancestry_report_sha256":ANCESTRY_SHA256,
        "retained_event_count":20, "added_event_count":6, "events":events,
        "current_history_multiplicity":HISTORY_MULTIPLICITY, "current_history_initial_list_bounds":lists,
        "dominance":{"resource_maximum_preserved":True, "sequential_maximum_preserved":True},
        "resource_limiting_event":"retirement.b25.query", "resource_work_floor_exact":str(floor),
        "resource_work_floor_bits":descriptive_bits(floor), "evaluated_resource_envelopes":envelopes,
        "category_one_ideal_envelope":probability(total), "fixed_poseidon2b_delta_headroom":probability(Fraction(1,2)-total),
        "sequential_local_rbr":probability(kappa), "sequential_at_two_to_64":probability(sequential),
        "sequential_largest_query_cap":str(query_cap),
        "conditions":["source-linked local knowledge extraction for each typed family", "RS-specific grouped common-agreement and source restoration at the stated radii", "complete coupled all-root compiler and recognizers for arithmetized children", "event-specific fixed-Poseidon2b deviation below the exact reported headroom", "honest authenticated public preprocessing", "declared minimum scalar and batch response prices", "one total adversarial budget including preprocessing and verification queries"],
        "status":"conditional source-linked v2.1 joint-ancestry soundness accounting"
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--json',action='store_true',help='emit the complete exact certificate')
    args = parser.parse_args()
    result = calculate(args.root)
    print(json.dumps(result,sort_keys=True,indent=2))


if __name__ == '__main__':
    main()
