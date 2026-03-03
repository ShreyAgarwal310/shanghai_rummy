import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.cards.discard_pile import DiscardPile


class TestDiscardPile(unittest.TestCase):
    def test_empty_pile_behavior(self):
        pile = DiscardPile()
        self.assertTrue(pile.is_empty())
        self.assertIsNone(pile.top_card())
        with self.assertRaises(IndexError):
            pile.take_top_card()

    def test_add_top_take(self):
        pile = DiscardPile()
        c1 = Card(suit="HEARTS", rank="5")
        c2 = Card(suit="SPADES", rank="A")

        pile.add_card(c1)
        pile.add_card(c2)

        self.assertEqual(len(pile), 2)
        self.assertEqual(pile.top_card(), c2)
        self.assertEqual(pile.take_top_card(), c2)
        self.assertEqual(pile.top_card(), c1)


if __name__ == "__main__":
    unittest.main()
