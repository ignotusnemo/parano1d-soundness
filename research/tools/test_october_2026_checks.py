"""Boundary checks for the new literature applicability diagnostics."""

import unittest
from fractions import Fraction
from pathlib import Path

from october_2026_checks import calculate_checks, diagnostic_checks, layers


class OctoberChecks(unittest.TestCase):
    def test_all_current_and_retained_retirement_layers_are_above_johnson(self):
        result = calculate_checks(Path(__file__).resolve().parents[2])
        self.assertGreater(result['johnsonLayerCount'],300)
        self.assertTrue(all(Fraction(x['squared_johnson_margin']) > 0 for x in result['johnsonLayers']))
        self.assertFalse(result['genericMcaTransfer']['positiveGapCondition'])

    def test_below_threshold_or_incomplete_domains_are_rejected(self):
        with self.assertRaises(ValueError): layers('below-johnson',256,1024,4,Fraction(49,100))
        with self.assertRaises(ValueError): layers('missing-layer',256,1000,4,Fraction(3,4))

    def test_a_tangent_alone_does_not_produce_a_second_field_witness(self):
        result = diagnostic_checks()
        self.assertEqual(result['satisfying_values'],[0])
        self.assertEqual(result['jacobian_tangent_values'],[0,1,2,3])
        self.assertEqual(result['certified_line_directions'],[0])
        self.assertEqual(len(result['positive_control_xy_zero_points']),4)


if __name__ == '__main__': unittest.main()
