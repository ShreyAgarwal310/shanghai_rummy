import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.melds.run_meld import RunMeld


class TestRunMeld(unittest.TestCase):
    def test_valid_basic_run(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="4"),
            Card(suit="HEARTS", rank="5"),
            Card(suit="HEARTS", rank="6"),
            Card(suit="HEARTS", rank="7"),
        ])
        self.assertTrue(meld.is_valid())

    def test_valid_run_with_single_internal_wild(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="4"),
            Card(suit="CLUBS", rank="2"),
            Card(suit="HEARTS", rank="6"),
            Card(suit="HEARTS", rank="7"),
        ])
        self.assertTrue(meld.is_valid())

    def test_invalid_run_with_touching_wilds(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="4"),
            Card(suit="CLUBS", rank="2"),
            Card(suit="JOKER", rank="JOKER"),
            Card(suit="HEARTS", rank="7"),
        ])
        self.assertFalse(meld.is_valid())

    def test_invalid_mixed_suits_among_non_wilds(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="4"),
            Card(suit="SPADES", rank="5"),
            Card(suit="HEARTS", rank="6"),
            Card(suit="HEARTS", rank="7"),
        ])
        self.assertFalse(meld.is_valid())

    def test_ace_low_valid(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="A"),
            Card(suit="HEARTS", rank="2"),
            Card(suit="HEARTS", rank="3"),
            Card(suit="HEARTS", rank="4"),
        ])
        self.assertTrue(meld.is_valid())

    def test_ace_wrap_invalid(self):
        meld = RunMeld([
            Card(suit="HEARTS", rank="Q"),
            Card(suit="HEARTS", rank="K"),
            Card(suit="HEARTS", rank="A"),
            Card(suit="HEARTS", rank="2"),
        ])
        self.assertFalse(meld.is_valid())


if __name__ == "__main__":
    unittest.main()
