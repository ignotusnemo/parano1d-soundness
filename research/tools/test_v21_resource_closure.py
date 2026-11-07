import unittest
from fractions import Fraction as F
from pathlib import Path

from v21_resource_closure import calculate, charge_schedule, fixed_lift


class ResourceClosureTests(unittest.TestCase):
    def test_actual_fixed_excess_is_charged_even_with_a_circuit_shortcut(self):
        self.assertEqual(fixed_lift(F(3,4),F(4,5),F(1,20),F(3,4)),F(3,4))
        with self.assertRaisesRegex(ValueError,"complete actual-budget excess"):
            fixed_lift(F(3,4),F(4,5),F(1,20),F(1,10))

    def test_both_sides_of_the_positive_part_are_covered(self):
        for denominator in range(2,18):
            for p in range(denominator+1):
                probability=F(p,denominator)
                for baseline in [F(0),F(1,20),F(1,2),F(1)]:
                    excess=max(F(0),probability-baseline)
                    self.assertEqual(fixed_lift(probability,probability,baseline,excess),excess)

    def test_the_lifting_requires_the_all_root_inclusion(self):
        with self.assertRaisesRegex(ValueError,"all-root event inclusion"):
            fixed_lift(F(3,4),F(1,4),F(1,20),F(1,5))

    def test_mixed_batch_prices_and_total_support_are_both_required(self):
        self.assertEqual(charge_schedule([(5,10,[3,2]),(2,10,[1,1])],[10,4],1,7,20),7)
        with self.assertRaisesRegex(ValueError,"batch price"):
            charge_schedule([(5,1,[3,2])],[10,4],1,5,1)
        with self.assertRaisesRegex(ValueError,"support"):
            charge_schedule([(5,10,[3,2])],[10,4],2,5,10)

    def test_exact_existing_headroom_and_every_depth_point(self):
        result=calculate(Path(__file__).resolve().parents[2])
        self.assertEqual(result['events'],26)
        self.assertEqual(F(result['idealEnvelope'])+F(result['fixedEventHeadroom']),F(1,2))
        self.assertFalse(result['fixedShortcutExample']['insideHalfSuccessHeadroom'])


if __name__ == '__main__':
    unittest.main()
