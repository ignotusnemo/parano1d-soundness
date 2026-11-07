import copy
import hashlib
import json
import unittest
from pathlib import Path

from install_v21_source_audits import PATCHES, PRODUCTION
from v21_source_closure import native_receipt

ROOT=Path(__file__).resolve().parents[2]


class SourceReceiptTests(unittest.TestCase):
    def setUp(self):
        recorded=json.loads((ROOT/'research/evidence/artifacts/2026-11-07-closure/source-binding.json').read_text())
        self.original={name:f'fixture:{name}'.encode() for name in PATCHES}
        sources=[]
        for name,module in PATCHES.items():
            audit=(ROOT/'research/tools/v21_audits'/module).read_bytes()
            sources.append({'path':name,'productionSha256':hashlib.sha256(self.original[name]).hexdigest(),
                            'auditModule':module,'auditSha256':hashlib.sha256(audit).hexdigest(),
                            'compiledFileSha256':hashlib.sha256(self.original[name]+audit).hexdigest(),
                            'originalSourcePrefixUnchanged':True})
        self.installed={'productionCommit':PRODUCTION,'sources':sources}
        names=[item['name'] for item in recorded['nativeAudits']['tests'] if item['status']=='ok']
        lines=[];offset=0
        for count in [4,23,1,1,1,3]:
            lines.extend(f'test {name} ... ok' for name in names[offset:offset+count]);offset+=count
            lines.append(f'test result: ok. {count} passed; 0 failed; 0 ignored;')
        lines.append('ALL_NATIVE_SOURCE_AUDITS_PASSED')
        self.log='\n'.join(lines)

    def test_complete_receipt_accepts_only_authenticated_test_sources(self):
        self.assertEqual(native_receipt(self.log,self.installed,ROOT,self.original)['passed'],33)
        for key,value in [('productionSha256','0'*64),('auditSha256','0'*64),
                          ('compiledFileSha256','0'*64),('originalSourcePrefixUnchanged',False)]:
            changed=copy.deepcopy(self.installed);changed['sources'][0][key]=value
            with self.assertRaises(ValueError):native_receipt(self.log,changed,ROOT,self.original)

    def test_missing_modules_and_incomplete_runs_are_rejected(self):
        changed=copy.deepcopy(self.installed);changed['sources'].pop()
        with self.assertRaises(ValueError):native_receipt(self.log,changed,ROOT,self.original)
        for altered in [self.log.replace('ALL_NATIVE_SOURCE_AUDITS_PASSED',''),
                        self.log.replace('3 passed; 0 failed;','2 passed; 0 failed;'),
                        self.log.replace(' ... ok',' ... ignored',1)]:
            with self.assertRaises(ValueError):native_receipt(altered,self.installed,ROOT,self.original)

    def test_a_failed_command_is_never_hidden_by_the_completion_marker(self):
        log=self.log+'\ntest malicious_case ... FAILED\ntest result: FAILED. 0 passed; 1 failed; 0 ignored;'
        with self.assertRaisesRegex(ValueError,'failed test'):native_receipt(log,self.installed,ROOT,self.original)


if __name__=='__main__':unittest.main()
