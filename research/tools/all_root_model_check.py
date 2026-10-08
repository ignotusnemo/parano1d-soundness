#!/usr/bin/env python3
"""Exact finite diagnostics for the adaptive compiler obligations.

These examples check model boundaries. They are not production attacks or a
proof of the complete quantum compiler theorem. No contributor code runs.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
from fractions import Fraction
from pathlib import Path
import re
import subprocess


SOURCE_PIN = "50d6dac5a37b9f1be425b5e6cd823de48f843b50"
ARGUMENT_PIN = "b159eb8c7c5d509ccbfc2102667769703272cd7c"
SOURCE_FILES = (
    "noid_ivc_core/src/challenger.rs",
    "noid_ivc_core/src/field_circuit.rs",
    "noid_ivc_core/src/proof.rs",
    "noid_ivc_core/src/public_io.rs",
    "noid_ivc_core/src/pcs/basefold.rs",
    "noid_recursive/src/acceptance/trace/self_verify.rs",
    "noid_recursive/src/acceptance/history_step/v2/banked/assembly.rs",
    "noid_recursive/src/region_sidecar/recording_duplex.rs",
    "noid_gkr/src/zk_authorization.rs",
    "noid_soundness/src/resource.rs",
    "noid_soundness/src/v2.rs",
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def exact(value: Fraction) -> str:
    return f"{value.numerator}/{value.denominator}"


def source_receipts(root: Path) -> tuple[list[dict], dict[str, str]]:
    receipts = []
    sources = {}
    for name in SOURCE_FILES:
        frozen = subprocess.run(
            ["git", "show", f"{SOURCE_PIN}:{name}"],
            cwd=root,
            capture_output=True,
            check=True,
        ).stdout
        current = (root / name).read_bytes()
        require(current == frozen, f"source differs from the frozen pin: {name}")
        sources[name] = frozen.decode("utf-8")
        receipts.append({
            "path": name,
            "sha256": hashlib.sha256(frozen).hexdigest(),
            "bytes": len(frozen),
            "matchesFrozenSource": True,
        })
    return receipts, sources


def namespace_flips() -> dict:
    """Enumerate all one-cell insertions for two independently owned cells."""
    outputs = tuple(range(4))
    masks = tuple(range(1 << len(outputs)))
    probabilities = []
    for mask in masks:
        accepted = sum(bool(mask & (1 << value)) for value in outputs)
        probabilities.append(Fraction(accepted, len(outputs)))
    transitions = 0
    reverse_flips = 0
    for masks_pair in itertools.product(masks, repeat=2):
        def local(owner: int, value: int | None) -> bool:
            # An already represented root can be bad before an insertion;
            # this ensures the check includes true-to-false flips as well.
            return True if value is None else bool(masks_pair[owner] & (1 << value))

        local_caps = [1 - probabilities[mask] for mask in masks_pair]
        for state in itertools.product((None,) + outputs, repeat=2):
            before_parts = tuple(local(i, state[i]) for i in range(2))
            before = any(before_parts)
            for owner in range(2):
                if state[owner] is not None:
                    continue
                flip_count = 0
                for value in outputs:
                    updated = list(state)
                    updated[owner] = value
                    after_parts = tuple(local(i, updated[i]) for i in range(2))
                    require(
                        before_parts[1 - owner] == after_parts[1 - owner],
                        "insertion changed a different owner's property",
                    )
                    after = any(after_parts)
                    if before != after:
                        flip_count += 1
                        reverse_flips += int(before and not after)
                probability = Fraction(flip_count, len(outputs))
                require(probability <= local_caps[owner], "maximum lemma failed")
                require(probability <= max(local_caps), "global maximum failed")
                transitions += len(outputs)

        # Also enumerate the absent-root convention, with false at None,
        # so false-to-true transitions are checked independently.
        def absent_local(owner: int, value: int | None) -> bool:
            return False if value is None else bool(masks_pair[owner] & (1 << value))

        for state in itertools.product((None,) + outputs, repeat=2):
            before_parts = tuple(absent_local(i, state[i]) for i in range(2))
            for owner in range(2):
                if state[owner] is not None:
                    continue
                flips = 0
                for value in outputs:
                    updated = list(state)
                    updated[owner] = value
                    after_parts = tuple(absent_local(i, updated[i]) for i in range(2))
                    require(before_parts[1 - owner] == after_parts[1 - owner], "owner drift")
                    flips += int(any(before_parts) != any(after_parts))
                probability = Fraction(flips, len(outputs))
                require(probability <= probabilities[masks_pair[owner]], "forward bound failed")
                transitions += len(outputs)
    require(reverse_flips > 0, "reverse flips were not exercised")
    return {
        "name": "disjoint_namespace_maximum",
        "classification": "finite_corollary_of_written_conditional_lemma",
        "propertyPairs": len(masks) ** 2,
        "outputAssignmentsChecked": transitions,
        "reverseFlipsObserved": reverse_flips,
        "passed": True,
    }


def shared_cell() -> dict:
    outputs = tuple(range(8))
    bad_sets = [{j} for j in range(4)]
    densities = [Fraction(len(values), len(outputs)) for values in bad_sets]
    union_density = Fraction(len(set().union(*bad_sets)), len(outputs))
    require(union_density > max(densities), "shared cell did not violate the maximum")
    return {
        "name": "shared_cell_maximum_countermodel",
        "classification": "counterexample_to_unqualified_model_implication",
        "singleStatementDensity": exact(max(densities)),
        "unionDensity": exact(union_density),
        "cellCount": 1,
        "digestCollisions": 0,
        "passed": True,
    }


def vector_expansion() -> dict:
    outputs = tuple(range(256))
    first_good = set(range(64))
    second_good = set(range(64, 128))
    require(not first_good & second_good, "accepting sets must have disjoint outputs")
    accepted = [
        (a, b) for a, b in itertools.product(outputs, repeat=2)
        if a in first_good and b in second_good
    ]
    atomic = Fraction(len(accepted), len(outputs) ** 2)
    favorable_prefix_flips = sum(b in second_good for b in outputs)
    cell_density = Fraction(favorable_prefix_flips, len(outputs))
    naive_with_finite = atomic + Fraction(2 * 2 + 1, len(outputs))
    require(atomic == Fraction(1, 16), "incorrect atomic density")
    require(cell_density == Fraction(1, 4), "incorrect expanded flip density")
    require(cell_density > atomic, "expansion did not separate the models")
    require(cell_density > naive_with_finite, "naive finite term obscured the example")
    return {
        "name": "atomic_vector_to_cell_countermodel",
        "classification": "counterexample_to_unqualified_model_implication",
        "atomicVectorDensity": exact(atomic),
        "lastCellFlipDensityAtFavorablePrefix": exact(cell_density),
        "rawOutputSupportSize": len(outputs),
        "vectorAssignmentsEnumerated": len(outputs) ** 2,
        "naiveDensityPlusFiniteAtTwoQueries": exact(naive_with_finite),
        "exampleAcceptingOutputPair": [0, 64],
        "winningFlipHasOutputCollision": False,
        "favorablePrefixCostIsNotAnAttackBound": True,
        "passed": True,
    }


def representation() -> dict:
    fixed_output = 0
    extracted_child = 0
    outer_fixed_relation = extracted_child == fixed_output
    database = {("outer", "root"): 2}
    child_key = ("child", "challenge")
    require(outer_fixed_relation and child_key not in database, "closure example failed")
    database[child_key] = 1
    ideal_child_accepts = extracted_child == database[child_key]
    require(outer_fixed_relation and not ideal_child_accepts, "coupling example failed")
    require(len(set(database.values())) == len(database), "accidental output collision")
    return {
        "name": "fixed_replay_does_not_imply_same_database_closure",
        "classification": "counterexample_to_unqualified_model_implication",
        "outerFixedRelationAccepts": outer_fixed_relation,
        "childInitiallyRepresented": False,
        "childAcceptedAfterDifferentIdealAnswer": ideal_child_accepts,
        "digestCollisions": 0,
        "passed": True,
    }


def parallel_recognizers() -> dict:
    outputs = tuple(range(4))
    assignments = set(itertools.product(outputs, repeat=2))
    accepted = {(0, 1)}
    accepted_or_collision = accepted | {state for state in assignments if state[0] == state[1]}
    nonempty_one_local_subsets = []
    slices_checked = 0
    for owner in range(2):
        for mask in range(1, 1 << len(outputs)):
            local_set = {
                state for state in assignments if mask & (1 << state[owner])
            }
            slices_checked += 1
            if local_set <= accepted:
                nonempty_one_local_subsets.append((owner, mask))
            require(not local_set <= accepted_or_collision, "collision union unexpectedly has a local cover")
    require(not nonempty_one_local_subsets, "unexpected strong recognizer")
    require(bool(accepted), "target property must be nonempty")
    return {
        "name": "parallel_conjunction_has_no_one_local_strong_cover",
        "classification": "counterexample_to_automatic_parallel_hypothesis",
        "batchWidth": 2,
        "assignmentCount": len(assignments),
        "nonemptyLocalPropertiesChecked": slices_checked,
        "strongCoverExists": False,
        "strongCoverAfterAdjoiningCollisionsExists": False,
        "doesNotRefuteAnyProductionProbabilityBound": True,
        "passed": True,
    }


def query_ledger() -> dict:
    adversary = [
        ("a0", "parent", "u"),
        ("a1", "wallet", "v"),
        ("a2", "parent", "u"),
    ]
    output_verification = [("v0", "terminal", "w")]
    embedded_ids = {"a0", "a1", "a2"}
    actual_ids = {event[0] for event in adversary}
    require(embedded_ids <= actual_ids, "embedded occurrence outside the budget")
    all_calls = adversary + output_verification
    support = {(kind, point) for _, kind, point in all_calls}
    require(len(all_calls) == 4 and len(support) == 3, "occurrence/support separation failed")
    wrong_charge = len(adversary) + len(embedded_ids) + len(output_verification)
    require(wrong_charge != len(all_calls), "duplicate charging was not detected")
    require(len(adversary) < len(all_calls), "output verification was not charged")
    return {
        "name": "query_occurrences_and_output_verification",
        "classification": "finite_corollary_of_written_conditional_ledger",
        "totalCallOccurrences": len(all_calls),
        "distinctAddresses": len(support),
        "incorrectDoubleCharge": wrong_charge,
        "postMeasurementOracleQueries": 0,
        "representationClosureIsAHypothesis": True,
        "passed": True,
    }


def inventory(sources: dict[str, str]) -> dict:
    literals = re.compile(r'"((?:wallet|history|v2|retirement)\.[a-z0-9.-]+)"')
    names = set(literals.findall(sources["noid_soundness/src/resource.rs"]))
    names.update(literals.findall(sources["noid_soundness/src/v2.rs"]))
    expected = {
        "wallet.query", "wallet.field", "history.query", "history.b25.proximity",
        "history.b255.proximity", "history.candidate-switching", "history.joint-sidecar",
        "v2.query", "v2.small.proximity", "v2.large.proximity",
        "v2.candidate-switching", "v2.joint-sidecar", "retirement.b25.query",
        "retirement.b25.proximity", "retirement.b25.pcs-scalar", "retirement.b25.reduction",
        "retirement.b255.query", "retirement.b255.proximity", "retirement.b255.pcs-scalar",
        "retirement.b255.reduction",
    }
    require(names == expected, f"inventory changed: missing={expected - names}, extra={names - expected}")
    return {
        "name": "frozen_twenty_event_inventory",
        "classification": "source_receipt_only",
        "events": sorted(names),
        "eventCount": len(names),
        "passed": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--production-root", required=True, type=Path)
    args = parser.parse_args()
    receipts, sources = source_receipts(args.production_root.resolve())
    checks = [
        namespace_flips(), shared_cell(), vector_expansion(), representation(),
        parallel_recognizers(), query_ledger(), inventory(sources),
    ]
    script_digest = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    report = {
        "schema": "parano1d-all-root-model-diagnostics-v1",
        "sourceCommit": SOURCE_PIN,
        "correspondenceArgumentCommit": ARGUMENT_PIN,
        "scriptSha256": script_digest,
        "status": "partial_mathematical_result",
        "fullAllRootContractSatisfied": False,
        "productionForgery": False,
        "frontierMetricChanges": [],
        "sourceReceipts": receipts,
        "checks": checks,
        "allFiniteChecksPassed": all(check["passed"] for check in checks),
    }
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
