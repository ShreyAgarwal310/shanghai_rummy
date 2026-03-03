import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.deck import Deck


class TestDeck(unittest.TestCase):
    def test_default_deck_size(self):
        deck = Deck()
        self.assertEqual(len(deck), 108)

    def test_draw_reduces_size(self):
        deck = Deck(num_decks=1, jokers_per_deck=0)
        start = len(deck)
        card = deck.draw()
        self.assertIsNotNone(card)
        self.assertEqual(len(deck), start - 1)

    def test_is_empty_and_draw_error(self):
        deck = Deck(num_decks=0, jokers_per_deck=0)
        self.assertTrue(deck.is_empty())
        with self.assertRaises(IndexError):
            deck.draw()

    def test_shuffle_keeps_size(self):
        deck = Deck()
        start = len(deck)
        deck.shuffle()
        self.assertEqual(len(deck), start)


if __name__ == "__main__":
    unittest.main()
