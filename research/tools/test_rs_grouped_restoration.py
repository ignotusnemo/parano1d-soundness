import unittest
from fractions import Fraction
from pathlib import Path

from rs_grouped_restoration import calculate, theorem_hypotheses


class GroupedRestorationTests(unittest.TestCase):
    def test_exact_authenticated_inventory(self):
        result = calculate(Path(__file__).resolve().parents[2])
        self.assertEqual(result["checkedLayers"], 421)
        self.assertEqual({r["multiplicity"] for r in result["layers"]}, {8, 100000, 318983})

    def test_list_radius_alone_is_insufficient(self):
        with self.assertRaisesRegex(ValueError, "Johnson"):
            theorem_hypotheses(1024, 256, Fraction(49, 100), 318983)

    def test_rejects_multiplicity_below_the_theorem_requirement(self):
        with self.assertRaisesRegex(ValueError, "multiplicity"):
            theorem_hypotheses(65536, 2048, Fraction(1, 5), 7)

    def test_boundary_is_checked_by_exact_square_comparison(self):
        self.assertEqual(theorem_hypotheses(100, 17, Fraction(1, 2), 4)["multiplicityMargin"], "0")
        with self.assertRaisesRegex(ValueError, "multiplicity"):
            theorem_hypotheses(100, 17, Fraction(1, 2), 3)


if __name__ == "__main__":
    unittest.main()
