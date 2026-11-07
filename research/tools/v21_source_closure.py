#!/usr/bin/env python3
"""Authenticate the production sources and native audit receipts for v2.1 closure."""

import argparse
import gzip
import hashlib
import json
import re
import subprocess
from pathlib import Path

from v21_certificate import PRODUCTION, checked, load_inputs
from install_v21_source_audits import PATCHES

SOURCES = {
    "noid_miner/src/v21_artifacts.rs": ["pub fn decode_v21_runtime_metadata_pinned(", "pub fn preflight_build_matrix("],
    "noid_node/build.rs": ["fn embed_v21_pack("],
    "noid_node/src/embedded_history_step_pack.rs": ["pub fn embedded_finance_runtime("],
    "noid_recursive/src/acceptance/history_step/runtime_parts_codec/capacity.rs": ["pub fn decode_compact("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/config.rs": ["pub fn new(", "pub fn for_class("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/bank.rs": ["pub fn pin(", "pub(super) fn parse(", "pub fn from_authorization_boundary("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/authorization_origin.rs": ["pub fn verify("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/assembly.rs": ["fn parent_selector(", "fn bind_lane(", "fn prepare_assembly<"],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/shared_parent.rs": ["pub(super) fn replay_shared("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/parent.rs": ["pub(super) fn replay("],
    "noid_recursive/src/acceptance/history_step/v2/capacity_banked/decision.rs": ["pub fn verify_terminal("],
    "noid_recursive/src/acceptance/history_step/gated_recorder.rs": ["pub(super) fn select_prefix("],
    "noid_recursive/src/acceptance/history_step/v2/banked/decision.rs": ["pub fn verify_terminal("],
    "noid_recursive/src/acceptance/history_step/v2/banked/bank.rs": ["pub fn from_authorization_boundary(", "pub fn from_retirement("],
    "noid_recursive/src/acceptance/history_step/v2/banked/retirement_codec.rs": ["pub fn verify("],
    "noid_recursive/src/acceptance/history_step_bank/retirement.rs": ["fn compute_binding("],
    "noid_recursive/src/acceptance/history_step_bank/retirement/evaluation.rs": ["pub fn verify_matrix_evaluations("],
    "noid_ivc_core/src/matrix_claim/sparse_c1.rs": ["pub fn verify("],
    "noid_ivc_core/src/matrix_claim/sparse_c1/preprocess.rs": [],
    "noid_ivc_core/src/matrix_claim/sparse_c1/wire.rs": [],
    "noid_ivc_core/src/challenger.rs": [],
    "noid_ivc_core/src/field_circuit.rs": ["pub fn alloc_bool(", "pub fn mul("],
    "noid_ivc_core/src/field_r1cs.rs": [],
    "noid_ivc_core/src/matrix_claim/c1.rs": [],
    "noid_recursive/src/acceptance/trace/mod.rs": ["pub fn pin_eq("],
    "noid_recursive/src/acceptance/trace/r_pcs_region.rs": ["fn pin_selected_recording_role(", "fn checked_pcs_binding_groups("],
    "noid_recursive/src/acceptance/trace/region_source_binding.rs": ["pub(crate) fn recording_choice_weights("],
    "noid_recursive/src/acceptance/trace/matrix_fold.rs": [],
    "noid_poseidon2b/src/native/permutation.rs": [],
    "noid_miner/src/history_protocol.rs": ["pub fn with_finance_runtime(", "pub fn verify_terminal("],
    "noid_node/src/main.rs": ["fn verify_history_step_terminal(", "async fn apply_exact_suffix_offthread("],
    "noid_node/src/networking/sync_plan.rs": ["fn suffix("],
    "noid_node/src/networking/suffix_sync.rs": [],
    "noid_chain/src/storage/mdbx_context.rs": ["pub fn commit_locally_proved_next_block(", "pub fn apply_next_block<", "pub fn apply_verified_recursive_suffix_block<", "pub fn apply_verified_reorg_suffix_with_applier_indexed<", "pub fn verify_snapshot_boundary<"],
    "noid_chain/src/storage/mdbx_store.rs": ["pub(crate) fn install_finalized_snapshot_staging<"],
    "noid_chain/src/storage/snapshot_staging.rs": [],
    "noid_chain/src/consensus/template.rs": ["pub unsafe fn seal_after_trusted_history_step_proof_unchecked("],
    "noid_miner/src/block_production.rs": ["pub fn prove(self,"],
}


def native_receipt(log, installed, root, source_bytes):
    checked(installed['productionCommit'] == PRODUCTION, "native audit production pin")
    checked(len(installed['sources']) == len(PATCHES) and
            {source['path'] for source in installed['sources']} == set(PATCHES),
            "complete append-only source inventory")
    for source in installed['sources']:
        checked(source['productionSha256'] == hashlib.sha256(source_bytes[source['path']]).hexdigest(), "native audit source prefix")
        checked(source['auditModule'] == PATCHES[source['path']], "native audit module identity")
        module = root/'research/tools/v21_audits'/source['auditModule']
        checked(hashlib.sha256(module.read_bytes()).hexdigest() == source['auditSha256'], "native audit module digest")
        checked(hashlib.sha256(source_bytes[source['path']] + module.read_bytes()).hexdigest() == source['compiledFileSha256'],
                "complete compiled source digest")
        checked(source['originalSourcePrefixUnchanged'] is True, "append-only audit injection")
    checked('ALL_NATIVE_SOURCE_AUDITS_PASSED' in log, "complete native audit run")
    checked('test result: FAILED' not in log and not re.search(r'^test \S+ \.\.\. FAILED$',log,re.M),
            "native audit log contains a failed test")
    all_runs = re.findall(r'test result: ok\. (\d+) passed; (\d+) failed; (\d+) ignored;',log)
    checked(all(int(failed)==0 for _,failed,_ in all_runs), "successful native test commands")
    # Cargo can emit zero-test integration binaries when selecting a unit-test
    # name without --lib. They have no executed tests and no additional effect.
    runs = [(p,f,i) for p,f,i in all_runs if int(p)>0]
    checked(len(runs) == 6, "six completed native test groups")
    checked([int(p) for p,_,_ in runs] == [4,23,1,1,1,3], "exact native group sizes")
    tests = re.findall(r'^test (\S+) \.\.\. (ok|ignored)$',log,re.M)
    checked(sum(status=='ok' for _,status in tests) == sum(int(passed) for passed,_,_ in runs), "native named test inventory")
    checked(sum('v21_closure_audit::' in name and status=='ok' for name,status in tests) == 7, "seven current source audit tests")
    required = {'storage::mdbx_context::tests::local_fast_commit_rejects_impossible_pow_before_state_or_tip_mutation',
                'storage::mdbx_context::tests::rejected_snapshot_terminal_leaves_canonical_headers_untouched',
                'storage::mdbx_store::tests::snapshot_correspondence_late_segment_substitution_rolls_back_every_durable_boundary',
                'storage::mdbx_context::v21_closure_audit::audit_snapshot_callback_and_metadata_guard_precede_any_state_mutation',
                'storage::mdbx_context::v21_closure_audit::audit_snapshot_installs_the_exact_verified_boundary_atomically',
                'storage::mdbx_context::v21_closure_audit::audit_late_segment_substitution_preserves_every_hot_and_durable_boundary',
                'acceptance::history_step::gated_recorder::v21_closure_audit::audit_shared_prefix_binds_every_selected_source_expression',
                'acceptance::history_step::gated_recorder::v21_closure_audit::audit_shared_prefix_rejects_nonboolean_selector_and_different_layouts',
                'acceptance::history_step::v2::capacity_banked::assembly::v21_closure_audit::audit_all_three_lanes_preserve_or_replace_every_point_value_and_live_cell',
                'acceptance::history_step::v2::capacity_banked::assembly::v21_closure_audit::audit_three_class_selector_rejects_detached_and_nonboolean_witnesses'}
    checked(required <= {name for name,status in tests if status=='ok'}, "complete State-boundary audit inventory")
    checked(sum(name.startswith('field_circuit::tests::') and status=='ok' for name,status in tests) == 23,
            "complete native channel test inventory")
    return {"commands":len(runs),"passed":sum(int(p) for p,_,_ in runs),
            "failed":0,"ignored":sum(int(i) for _,_,i in runs),
            "logSha256":hashlib.sha256(log.encode()).hexdigest(),
            "tests":[{"name":name,"status":status} for name,status in tests],
            "installedSource":installed}


def calculate(root, production, native_log, installed):
    profile,_,profile_hash=load_inputs(root)
    receipts=[]
    source_bytes={}
    for name,anchors in SOURCES.items():
        raw=subprocess.check_output(['git','show',f'{PRODUCTION}:{name}'],cwd=production)
        source_bytes[name]=raw
        content=raw.decode()
        locations=[]
        for anchor in anchors:
            checked(content.count(anchor) == 1, f"unique production anchor: {name} {anchor}")
            locations.append({"symbol":anchor,"line":content[:content.index(anchor)].count('\n')+1})
        receipts.append({"path":name,"sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw),"anchors":locations})
    metadata=gzip.decompress((root/'research/certificates/v2.1.0/v21-runtime-metadata.bin.gz').read_bytes())
    flags=int.from_bytes(metadata[124:132],'little')
    checked(flags & ~15 == 0, "complete compact builder flags")
    decoded={"fusedPins":bool(flags&1),"reusedLinearRows":bool(flags&2),
             "sharedM24":bool(flags&4),"productAliases":bool(flags&8)}
    native=native_receipt(native_log,installed,root,source_bytes)
    return {"schemaVersion":1,"productionCommit":PRODUCTION,"bankDigest":profile['bankDigest'],
            "profileSha256":profile_hash,"activationHeight":profile['activationHeight'],
            "classCount":3,"compactFlags":flags,"builderModes":decoded,
            "sources":receipts,"nativeAudits":native,
            "proof":"docs/v2.1-source-binding-proofs.md",
            "established":["pinned metadata and preprocessing binding","verified predecessor activation boundary",
                           "three-class pointwise transcript/source adapter","inactive matrix-obligation preservation",
                           "ordinary, suffix, reorg, snapshot and local-production State installation interface"],
            "conditions":["honest authenticated executable artifacts","exact field arithmetic and native primitives",
                          "declared local C1 reductions","fixed production callbacks"],
            "remainingGlobalConditions":["coupled all-root compilation","resource-aware fixed-Poseidon2b deviation"]}


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--production',required=True,type=Path)
    p.add_argument('--native-log',required=True,type=Path)
    p.add_argument('--installed-source',required=True,type=Path)
    a=p.parse_args()
    print(json.dumps(calculate(Path(__file__).resolve().parents[2],a.production,a.native_log.read_text(),json.loads(a.installed_source.read_text())),sort_keys=True,indent=2))
