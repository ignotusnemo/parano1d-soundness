"""Parameter-binding and exact resource checks for the published v2.1 profile."""

import importlib.util
import json
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

SOURCE = Path(__file__).with_name('v21_certificate.py')
spec = importlib.util.spec_from_file_location('v21_certificate', SOURCE)
certificate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(certificate)
ROOT = SOURCE.parents[2]


class V21CertificateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = certificate.calculate(ROOT)

    def copied_inputs(self, directory):
        target = Path(directory)
        for name in ['research/certificates/v2.1.0/profile.json', 'research/certificates/v2.1.0/v21-runtime-metadata.bin.gz', 'research/evidence/artifacts/2026-10-13/v2-soundness-mainnet.json']:
            path = target/name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes((ROOT/name).read_bytes())
        return target

    def mutate_profile(self, transform):
        with tempfile.TemporaryDirectory() as directory:
            root = self.copied_inputs(directory)
            path = root/'research/certificates/v2.1.0/profile.json'
            profile = json.loads(path.read_text())
            transform(profile)
            path.write_text(json.dumps(profile))
            with self.assertRaises(ValueError): certificate.calculate(root)

    def test_all_ancestry_and_three_current_classes_remain_in_one_inventory(self):
        ids = {e['id'] for e in self.result['events']}
        self.assertEqual(len(ids),26)
        self.assertTrue(certificate.ANCESTRY_EVENTS <= ids)
        self.assertEqual([c['class'] for c in self.result['classes']],[0,1,2])
        self.assertIn('v21.native.proximity',ids)
        self.assertEqual(self.result['dominance'],{'resource_maximum_preserved':True,'sequential_maximum_preserved':True})

    def test_wrong_release_revision_bank_or_activation_is_rejected(self):
        self.mutate_profile(lambda p:p.update(productionCommit='0'*40))
        self.mutate_profile(lambda p:p.update(bankDigest='0'*64))
        self.mutate_profile(lambda p:p.update(activationHeight=210537))

    def test_dropped_native_class_or_wrong_pcs_domain_is_rejected(self):
        self.mutate_profile(lambda p:p['classes'].pop())
        self.mutate_profile(lambda p:p['classes'][2]['pcs'].update(codeword_log2=20))
        self.mutate_profile(lambda p:p['classes'][0]['pcs'].update(plaintext_tail_len=128))
        self.mutate_profile(lambda p:p['classes'][2].update(matrix_digest='0'*64))

    def test_current_authorization_configuration_is_bound(self):
        self.mutate_profile(lambda p:p['authorizationLayout'].update(terminalPadGroups=1))
        self.mutate_profile(lambda p:p['authorizationLayout'].update(libraCells=431))
        self.mutate_profile(lambda p:p['wallet'].update(query_count=64))

    def test_corrupted_runtime_metadata_or_historical_report_is_rejected(self):
        import gzip
        with tempfile.TemporaryDirectory() as directory:
            root = self.copied_inputs(directory)
            path = root/'research/certificates/v2.1.0/v21-runtime-metadata.bin.gz'
            data = bytearray(gzip.decompress(path.read_bytes()))
            data[-1] ^= 1
            path.write_bytes(gzip.compress(data,mtime=0))
            with self.assertRaisesRegex(ValueError,'authenticated runtime'): certificate.calculate(root)
        with tempfile.TemporaryDirectory() as directory:
            root = self.copied_inputs(directory)
            path = root/'research/evidence/artifacts/2026-10-13/v2-soundness-mainnet.json'
            path.write_bytes(path.read_bytes()+b' ')
            with self.assertRaisesRegex(ValueError,'authenticated historical'): certificate.calculate(root)

    def test_integer_boundary_and_all_nist_depth_points_are_checked(self):
        result = self.result
        self.assertEqual([x['depth_bits'] for x in result['evaluated_resource_envelopes']],[40,64,96])
        kappa = certificate.exact(result['sequential_local_rbr'])
        cap = int(result['sequential_largest_query_cap'])
        self.assertLess(certificate.ideal_bound(cap,kappa),Fraction(1,2))
        self.assertGreaterEqual(certificate.ideal_bound(cap+1,kappa),Fraction(1,2))
        self.assertGreater(certificate.exact(result['resource_work_floor_exact']),2**170)
        self.assertLess(certificate.exact(result['category_one_ideal_envelope']),Fraction(1,2))

    def test_october_binary_field_counterexample_regimes_are_separated_exactly(self):
        # Johnson agreement is sqrt((K-1)/N). Compare squared rationals,
        # including every conceptual layer, without floating point or a
        # large-characteristic proximity assumption.
        owner_agreement = Fraction(1,5)
        for n,k in [(65536,2048),(32768,1024),(16384,512),(8192,256),(4096,128),(2048,64),(1024,32),(512,16)]:
            self.assertGreater(owner_agreement**2,Fraction(k-1,n))
        m = certificate.HISTORY_MULTIPLICITY
        agreement = Fraction(m+1,2*m)
        for c in self.result['classes']:
            n = c['pcs']['plaintext_tail_len']
            while n <= c['pcs']['codeword_len']:
                self.assertGreater(agreement**2,Fraction(n//4-1,n))
                n *= 2
        # A generic list-decoding-to-MCA transfer at p=4/5 only covers
        # gamma < 1-sqrt(1-p). The selected gamma=4/5 is outside it.
        # A concrete radius gamma=1/2 is within that generic theorem.
        p = Fraction(4,5)
        self.assertLess((1-Fraction(4,5))**2,1-p)
        self.assertGreater((1-Fraction(1,2))**2,1-p)


if __name__ == '__main__': unittest.main()
