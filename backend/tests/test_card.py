import sys
import types
import unittest
from pathlib import Path

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card

class TestCard(unittest.TestCase):
    def test_normalizes_rank_and_suit(self):
        card = Card(suit="hearts", rank=11)
        self.assertEqual(card.suit, "HEARTS")
        self.assertEqual(card.rank, "J")

    def test_joker_normalizes_suit(self):
        joker = Card(suit=None, rank="joker")
        self.assertEqual(joker.suit, "JOKER")
        self.assertEqual(joker.rank, "JOKER")

    def test_invalid_rank_raises(self):
        with self.assertRaises(ValueError):
            Card(suit="HEARTS", rank="1")

    def test_invalid_suit_raises(self):
        with self.assertRaises(ValueError):
            Card(suit="STARS", rank="7")

    def test_wildcard_only_for_joker_and_two_of_clubs(self):
        self.assertTrue(Card(suit="JOKER", rank="JOKER").is_wildcard)
        self.assertTrue(Card(suit="CLUBS", rank="2").is_wildcard)
        self.assertFalse(Card(suit="HEARTS", rank="2").is_wildcard)

    def test_point_values_follow_rules(self):
        self.assertEqual(Card(suit="CLUBS", rank="2").point_value, 50)
        self.assertEqual(Card(suit="HEARTS", rank="A").point_value, 20)
        self.assertEqual(Card(suit="SPADES", rank="K").point_value, 10)
        self.assertEqual(Card(suit="DIAMONDS", rank="7").point_value, 7)


if __name__ == "__main__":
    unittest.main()
