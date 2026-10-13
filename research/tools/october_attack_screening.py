#!/usr/bin/env python3
"""Check October attack parameters against pinned production source and field arithmetic."""

from __future__ import annotations

import argparse
from functools import lru_cache
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import subprocess


SOURCE_PIN = "50d6dac5a37b9f1be425b5e6cd823de48f843b50"
SOURCES = (
    "noid_core/src/hardware.rs",
    "noid_poseidon2b/src/native/permutation.rs",
    "noid_poseidon2b/src/native/compression.rs",
    "noid_gkr/src/zk_authorization.rs",
    "noid_gkr/src/zk_auth_capsule.rs",
    "noid_gkr/src/zk_auth_qrom.rs",
    "noid_fri_binius/src/zk_capsule_pcs.rs",
    "noid_soundness/src/local.rs",
    "noid_soundness/src/resource.rs",
    "noid_soundness/src/v2.rs",
    "noid_fri_binius/src/interleaved_commit.rs",
    "noid_node/src/networking/snapshot_sync.rs",
    "noid_node/src/snapshot_header_staging.rs",
    "noid_node/src/snapshot_tail_staging.rs",
    "noid_fri_binius/src/zk_affine_code.rs",
)
MASK = (1 << 128) - 1


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def multiply(a: int, b: int) -> int:
    """GF(2^128) in the production flat x^128+x^7+x^2+x+1 basis."""
    result = 0
    while b:
        if b & 1:
            result ^= a
        b >>= 1
        carry = a >> 127
        a = (a << 1) & MASK
        if carry:
            a ^= 0x87
    return result


@lru_cache(maxsize=None)
def inverse(a: int) -> int:
    require(a != 0, "zero has no multiplicative inverse")
    power, result = MASK - 1, 1
    while power:
        if power & 1:
            result = multiply(result, a)
        a = multiply(a, a)
        power >>= 1
    return result


def rank(rows: list[list[int]]) -> int:
    matrix = [row[:] for row in rows]
    pivot = 0
    for col in range(len(matrix[0])):
        chosen = next((i for i in range(pivot, len(matrix)) if matrix[i][col]), None)
        if chosen is None:
            continue
        matrix[pivot], matrix[chosen] = matrix[chosen], matrix[pivot]
        factor = inverse(matrix[pivot][col])
        matrix[pivot] = [multiply(value, factor) for value in matrix[pivot]]
        for row in range(len(matrix)):
            if row != pivot and matrix[row][col]:
                factor = matrix[row][col]
                matrix[row] = [a ^ multiply(factor, b)
                               for a, b in zip(matrix[row], matrix[pivot])]
        pivot += 1
        if pivot == len(matrix):
            break
    return pivot


def matrix_inverse(matrix: list[list[int]]) -> list[list[int]]:
    width = len(matrix)
    rows = [row[:] + [int(i == j) for j in range(width)]
            for i, row in enumerate(matrix)]
    for col in range(width):
        chosen = next(i for i in range(col, width) if rows[i][col])
        rows[col], rows[chosen] = rows[chosen], rows[col]
        factor = inverse(rows[col][col])
        rows[col] = [multiply(value, factor) for value in rows[col]]
        for row in range(width):
            if row != col:
                factor = rows[row][col]
                rows[row] = [a ^ multiply(factor, b) for a, b in zip(rows[row], rows[col])]
    return [row[width:] for row in rows]


def full_rank_minors(matrix: list[list[int]]) -> int:
    width, count = len(matrix), 0
    for size in range(1, width + 1):
        for rows in itertools.combinations(range(width), size):
            for cols in itertools.combinations(range(width), size):
                minor = [[matrix[row][col] for col in cols] for row in rows]
                require(rank(minor) == size, f"singular minor: rows={rows}, cols={cols}")
                count += 1
    return count


def check(production: Path) -> dict:
    sources, receipts = {}, []
    for name in SOURCES:
        frozen = subprocess.check_output(["git", "show", f"{SOURCE_PIN}:{name}"], cwd=production)
        require((production / name).read_bytes() == frozen, f"source changed from pin: {name}")
        sources[name] = frozen.decode()
        receipts.append({"path": name, "sha256": hashlib.sha256(frozen).hexdigest(),
                         "bytes": len(frozen), "matchesProductionPin": True})

    permutation = sources[SOURCES[1]]
    values = {}
    for symbol in ["STATE_SIZE", "SBOX_EXPONENT", "F_ROUNDS", "P_ROUNDS"]:
        match = re.search(rf"pub const {symbol}: usize = (\d+);", permutation)
        require(match is not None, f"missing literal {symbol}")
        values[symbol] = int(match[1])
    require(values == {"STATE_SIZE": 4, "SBOX_EXPONENT": 7, "F_ROUNDS": 8, "P_ROUNDS": 58},
            "reviewed Poseidon2b tuple changed")
    require(math.gcd(values["SBOX_EXPONENT"], MASK) == 1, "S-box is not bijective")

    matrix_literal = re.search(r"pub const MDS_FULL[^=]*=\s*\[(.*?)\];", permutation, re.S)
    require(matrix_literal is not None, "external matrix not found")
    entries = [int(value, 16) for value in re.findall(r"0x[0-9a-fA-F_]+", matrix_literal[1])]
    require(len(entries) == 16, "external matrix width changed")
    expected = [5, 7, 1, 3, 4, 6, 1, 1, 1, 3, 5, 7, 1, 1, 4, 6]
    require(entries == expected, "external matrix changed")
    conversion = re.search(r"pub const TOWER_TO_FLAT[^=]*=\s*\[(.*?)\];", sources[SOURCES[0]], re.S)
    require(conversion is not None, "basis conversion not found")
    columns = [int(value.replace("_", ""), 16)
               for value in re.findall(r"0x[0-9a-fA-F_]+", conversion[1])]
    require(len(columns) == 128 and columns[0] == 1, "basis conversion shape changed")

    def flat(value: int) -> int:
        result = 0
        for bit, column in enumerate(columns):
            if (value >> bit) & 1:
                result ^= column
        return result

    matrix = [[flat(value) for value in entries[start:start + 4]] for start in range(0, 16, 4)]
    inverted = matrix_inverse(matrix)
    count = full_rank_minors(matrix)
    inverse_count = full_rank_minors(inverted)
    require(count == inverse_count == 69, "incomplete MDS audit")

    cases = []
    for k in [1, 2]:
        width = values["STATE_SIZE"]
        remaining = (width - k) // (k + 1)
        cases.append({"k": k, "fixedInputLanes": k, "fixedOutputLanes": k,
                      "baselinePartialRoundsSkipped": width - 2 * k,
                      "collapseFreeVariables": remaining, "requiredOutputVariables": k,
                      "minimumFeasibleWidth": k * (k + 2),
                      "publishedFrontCollapseFeasible": remaining >= k,
                      "remainingPartialSkipBudget": max(0, remaining - k)})
    require(cases[1]["collapseFreeVariables"] == 0 and
            cases[1]["minimumFeasibleWidth"] == 8 and
            not cases[1]["publishedFrontCollapseFeasible"], "CICO-2 branch changed")
    require(cases[0]["publishedFrontCollapseFeasible"] and
            cases[0]["remainingPartialSkipBudget"] == 0, "CICO-1 boundary changed")
    require(all((values["STATE_SIZE"] - reserved) // 3 < 2 for reserved in range(3)),
            "CICO-2 acquired two tuple variables")

    auth = sources["noid_gkr/src/zk_authorization.rs"]
    body = auth.split("pub(crate) fn prove_zk_authorization_from_state(", 1)[1].split("\n}", 1)[0]
    require("let mut rng = OsRng;" in body, "OS entropy boundary changed")
    require("fn prove_zk_authorization_from_state_with_rng(" in auth and
            "pub fn prove_zk_authorization_from_state_with_rng(" not in auth,
            "deterministic RNG injection boundary changed")
    require("zk_capsule_pcs_commit_fresh(state, rng)?" in auth, "fresh PCS entry changed")
    qrom = sources["noid_gkr/src/zk_auth_qrom.rs"]
    require("without grind" in qrom.lower() or "no grind credit" in qrom.lower(),
            "grinding-free IOP premise marker changed")
    compression = sources["noid_poseidon2b/src/native/compression.rs"]
    require("state[0] ^ a0" in compression and "state[1] ^ a1" in compression,
            "two-lane feed-forward changed")
    merkle = sources["noid_fri_binius/src/interleaved_commit.rs"]
    require("pub type SourceHash = [u8; 32];" in merkle and
            "if hash != &cap_nodes[*idx]" in merkle,
            "complete two-lane cap comparison changed")
    pcs = sources["noid_fri_binius/src/zk_capsule_pcs.rs"]
    require("flat_digest_to_tower_lanes(&self.cap.hashes[lane / 2])[lane & 1]" in pcs,
            "cap transcript omitted a digest lane")
    require("pub struct SourceBatchedMerkleProof {\n    pub siblings: Vec<SourceHash>,\n}" in merkle,
            "Merkle opening format changed")
    require("pub const ZK_AUTH_QROM_FIXED_GRIND_SOUNDNESS_CREDIT_BITS: u32 = 0;" in qrom,
            "final nonce acquired fixed security credit")
    affine = sources["noid_fri_binius/src/zk_affine_code.rs"]
    def literal_length(symbol: str) -> int:
        match = re.search(rf"pub const {symbol}: usize = ([0-9_]+)(?: << ([0-9_]+))?;", affine)
        require(match is not None, f"missing affine length: {symbol}")
        return int(match[1].replace("_", "")) << (int(match[2]) if match[2] else 0)
    message_length = 1 << literal_length("AFFINE_CODE_MESSAGE_LOG")
    state_length = literal_length("AFFINE_STATE_LEN")
    libra_length = literal_length("AFFINE_LIBRA_MASK_LEN")
    pcs_length = literal_length("AFFINE_PCS_COINS_LEN")
    padding_length = message_length - state_length - libra_length - pcs_length
    require((message_length, state_length, libra_length, padding_length, pcs_length) ==
            (2048, 512, 256, 256, 1024), "private region geometry changed")
    region_bits = {"libra": libra_length * 128, "padding": padding_length * 128,
                   "pcs": pcs_length * 128, "companion": message_length * 256}
    attempts = 1 << 64
    pairs = attempts * (attempts - 1) // 2
    require(pairs * len(region_bits) < 1 << 129, "pair union numerator changed")

    return {
        "schemaVersion": 1, "reviewedAt": "2026-10-13", "productionRevision": SOURCE_PIN,
        "method": "exact algebra and frozen-source correspondence",
        "poseidon2b": {"characteristic": 2, "fieldBits": 128, "width": 4,
                        "sboxExponent": 7, "fullRounds": 8, "partialRounds": 58,
                        "initialFullRounds": 4, "finalFullRounds": 4,
                        "sboxBijective": True, "fullRankExternalMinors": count,
                        "fullRankInverseMinors": inverse_count,
                        "paper": "https://eprint.iacr.org/2026/1692",
                        "reviewedPdfSha256": "907b85088cc8c78d0ca84656f7c0e8f008f4690a7e103c5f2df880aafefcb89d",
                        "cicoCases": cases,
                        "cico2MaxTupleVariablesWithoutParticularReservation": 1,
                        "cico1AfterFrontCollapse": {"remainingInitialFullRounds": 2,
                                                   "remainingPartialRounds": 58,
                                                   "residualPartialSkipBudget": 0,
                                                   "outputLanesSolved": 1,
                                                   "authenticatedDigestLanes": 2},
                        "merkleCapComparisonBytes": 32,
                        "capTranscriptIncludesBothDigestLanes": True},
        "authorization": {"freshOsEntropyAtPublicEntry": True,
                          "rngInjectionHelperPrivate": True, "freshPcsCommitAtEachAttempt": True,
                          "condition": "independent OS-CSPRNG entropy for each honest proving attempt",
                          "merkleSiblingObservation": "32-byte commitment hash",
                          "sdithVoleSeedShares": False, "mqomCorrelatedGgmSeedShares": False,
                          "wholePrivateRegionRepetition": {
                              "model": "independent uniform field coins per honest attempt",
                              "regionBits": region_bits, "attempts": str(attempts),
                              "attemptPairs": str(pairs),
                              "bound": "choose(q,2) * sum_R 2^(-bits(R))",
                              "strictUpperBoundPowerOfTwoExponent": 129 - min(region_bits.values())}},
        "pow": {"sourceCorrespondence": "grinding-free base IOP; final nonce has no fixed QROM security credit",
                "fixedGrindSecurityCreditBits": 0},
        "sourceReceipts": receipts,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--production", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = check(args.production.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"result": "passed", "productionRevision": SOURCE_PIN,
                      "sourceFiles": len(result["sourceReceipts"]),
                      "externalAndInverseMinors": 138,
                      "cicoCases": result["poseidon2b"]["cicoCases"]}))


if __name__ == "__main__":
    main()
