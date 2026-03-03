import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.melds.set_meld import SetMeld


class TestSetMeld(unittest.TestCase):
    def test_valid_set(self):
        meld = SetMeld([
            Card(suit="HEARTS", rank="7"),
            Card(suit="SPADES", rank="7"),
            Card(suit="CLUBS", rank="2"),
        ])
        self.assertTrue(meld.is_valid())

    def test_invalid_too_short(self):
        meld = SetMeld([
            Card(suit="HEARTS", rank="7"),
            Card(suit="SPADES", rank="7"),
        ])
        self.assertFalse(meld.is_valid())

    def test_invalid_not_enough_non_wild(self):
        meld = SetMeld([
            Card(suit="JOKER", rank="JOKER"),
            Card(suit="CLUBS", rank="2"),
            Card(suit="JOKER", rank="JOKER"),
        ])
        self.assertFalse(meld.is_valid())

    def test_invalid_mixed_non_wild_ranks(self):
        meld = SetMeld([
            Card(suit="HEARTS", rank="7"),
            Card(suit="SPADES", rank="8"),
            Card(suit="CLUBS", rank="2"),
        ])
        self.assertFalse(meld.is_valid())


if __name__ == "__main__":
    unittest.main()
