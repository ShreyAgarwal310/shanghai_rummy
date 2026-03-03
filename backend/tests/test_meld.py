import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.melds.meld import Meld


class DummyMeld(Meld):
    def is_valid(self):
        return True


class TestMeld(unittest.TestCase):
    def test_non_wild_and_wild_split(self):
        cards = [
            Card(suit="CLUBS", rank="2"),
            Card(suit="JOKER", rank="JOKER"),
            Card(suit="HEARTS", rank="9"),
        ]
        meld = DummyMeld(cards)

        self.assertEqual(len(meld.wild_cards), 2)
        self.assertEqual(len(meld.non_wild_cards), 1)
        self.assertEqual(meld.non_wild_cards[0].rank, "9")


if __name__ == "__main__":
    unittest.main()
