#!/usr/bin/env python3
"""Recheck exact permutation arithmetic and named v2.1 source interfaces."""

import argparse
import hashlib
import json
import math
import re
import subprocess
from pathlib import Path

from october_attack_screening import SOURCES, full_rank_minors, matrix_inverse
from v21_certificate import PRODUCTION, checked, load_inputs


def check(production, root):
    profile, _, _ = load_inputs(root)
    sources, receipts = {}, []
    names = sorted(set(SOURCES) | set(profile['sourceHashes']))
    for name in names:
        frozen = subprocess.check_output(['git','show',f'{PRODUCTION}:{name}'],cwd=production)
        digest = hashlib.sha256(frozen).hexdigest()
        if name in profile['sourceHashes']:
            checked(digest == profile['sourceHashes'][name],f'profile source hash: {name}')
        previous = subprocess.check_output(['git','show',f'50d6dac5a37b9f1be425b5e6cd823de48f843b50:{name}'],cwd=production,stderr=subprocess.DEVNULL) if name in SOURCES else None
        sources[name] = frozen.decode()
        receipts.append({'path':name,'sha256':digest,'bytes':len(frozen),'sameAsPreviousAuditedSource':previous == frozen if previous is not None else None})
    permutation = sources['noid_poseidon2b/src/native/permutation.rs']
    values = {symbol:int(re.search(rf'pub const {symbol}: usize = (\d+);',permutation)[1]) for symbol in ['STATE_SIZE','SBOX_EXPONENT','F_ROUNDS','P_ROUNDS']}
    checked(values == {'STATE_SIZE':4,'SBOX_EXPONENT':7,'F_ROUNDS':8,'P_ROUNDS':58},'permutation parameters')
    literal = re.search(r'pub const MDS_FULL[^=]*=\s*\[(.*?)\];',permutation,re.S)[1]
    entries = [int(v.replace('_',''),16) for v in re.findall(r'0x[0-9a-fA-F_]+',literal)]
    conversion = re.search(r'pub const TOWER_TO_FLAT[^=]*=\s*\[(.*?)\];',sources['noid_core/src/hardware.rs'],re.S)[1]
    columns = [int(v.replace('_',''),16) for v in re.findall(r'0x[0-9a-fA-F_]+',conversion)]
    checked(len(entries) == 16 and len(columns) == 128,'matrix and basis shape')
    def flat(value):
        result = 0
        for i,c in enumerate(columns):
            if value >> i & 1: result ^= c
        return result
    matrix = [[flat(v) for v in entries[i:i+4]] for i in range(0,16,4)]
    minors = [full_rank_minors(matrix),full_rank_minors(matrix_inverse(matrix))]
    checked(minors == [69,69] and math.gcd(7,2**128-1) == 1,'exact permutation arithmetic')
    auth = sources['noid_gkr/src/zk_authorization.rs']
    checked('let mut rng = OsRng;' in auth and 'zk_capsule_pcs_commit_fresh(state, rng)?' in auth,'fresh honest proving entry')
    qrom = sources['noid_gkr/src/zk_auth_qrom.rs']
    checked('pub const ZK_AUTH_QROM_FIXED_GRIND_SOUNDNESS_CREDIT_BITS: u32 = 0;' in qrom,'zero nonce credit')
    compression = sources['noid_poseidon2b/src/native/compression.rs']
    checked('state[0] ^ a0' in compression and 'state[1] ^ a1' in compression,'two-lane feed-forward')
    caps = sources['noid_fri_binius/src/interleaved_commit.rs']
    checked('pub type SourceHash = [u8; 32];' in caps and 'if hash != &cap_nodes[*idx]' in caps,'full cap hash comparison')
    return {'schemaVersion':1,'productionCommit':PRODUCTION,'sourceReceipts':receipts,
            'poseidon2b':{'parameters':values,'externalMinors':69,'inverseMinors':69,'sboxBijective':True,
                         'cico2RemainingTupleVariables':(4-2)//3,'cico2RequiredTupleVariables':2,
                         'feedForwardLanes':2,'capComparisonBytes':32},
            'honestProvingEntry':'OsRng and fresh PCS commitment under independent OS entropy',
            'fixedNonceSecurityCreditBits':0,'authorizationLayout':profile['authorizationLayout'],
            'method':'exact field arithmetic and named source correspondence checks'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--production',required=True,type=Path)
    args = parser.parse_args()
    print(json.dumps(check(args.production,Path(__file__).resolve().parents[2]),sort_keys=True,indent=2))
