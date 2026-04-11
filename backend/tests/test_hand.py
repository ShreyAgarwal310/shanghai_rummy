"""
Unit tests for the Hand class (app/hands.py).

Testing strategy
----------------
Hand manages a mutable collection of Card objects and exposes methods
for adding, removing, sorting, and scoring cards.  Because it has no
external dependencies beyond Card, we can exercise every method in
pure isolation.

Equivalence classes / partitions
---------------------------------
1. Size state   – empty hand vs. non-empty hand
2. add_card     – idempotent growth (each call adds exactly one card)
3. discard_card – card present (succeeds) vs. absent (ValueError)
4. deadwood /   – number cards (face value), face cards (10 pts),
   calculate_   – Ace (20 pts), wildcard (50 pts), mixed hand
   value
5. sort_cards   – already sorted, reverse-sorted, tie broken by suit
6. get_cards    – returns a copy (mutation isolation)
7. is_empty     – True before any add, False after, True again after discard
8. __len__      – tracks add and discard operations
9. __repr__     – string form is stable and readable
"""

import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.hands import Hand


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_card(rank, suit="HEARTS"):
    return Card(suit=suit, rank=rank)


JOKER = Card(suit="JOKER", rank="JOKER")
TWO_OF_CLUBS = Card(suit="CLUBS", rank="2")   # wildcard by Shanghai rules


# ---------------------------------------------------------------------------
# 1. Empty-hand invariants
# ---------------------------------------------------------------------------

class TestHandInitialState(unittest.TestCase):
    def setUp(self):
        self.hand = Hand()

    def test_starts_empty(self):
        self.assertTrue(self.hand.is_empty())

    def test_initial_len_is_zero(self):
        self.assertEqual(len(self.hand), 0)

    def test_deadwood_empty_hand(self):
        self.assertEqual(self.hand.deadwood(), 0)

    def test_calculate_value_empty_hand(self):
        self.assertEqual(self.hand.calculate_value(), 0)

    def test_get_cards_empty_returns_empty_list(self):
        self.assertEqual(self.hand.get_cards(), [])

    def test_repr_empty(self):
        self.assertEqual(repr(self.hand), "Hand([])")


# ---------------------------------------------------------------------------
# 2 & 7 & 8. add_card, is_empty, __len__
# ---------------------------------------------------------------------------

class TestHandAddCard(unittest.TestCase):
    def setUp(self):
        self.hand = Hand()

    def test_add_one_card_len_becomes_one(self):
        self.hand.add_card(make_card("7"))
        self.assertEqual(len(self.hand), 1)

    def test_add_one_card_not_empty(self):
        self.hand.add_card(make_card("7"))
        self.assertFalse(self.hand.is_empty())

    def test_add_three_cards_len_is_three(self):
        for rank in ("3", "5", "K"):
            self.hand.add_card(make_card(rank))
        self.assertEqual(len(self.hand), 3)

    def test_add_same_card_object_twice_len_is_two(self):
        # Hand uses a plain list — duplicates are allowed
        c = make_card("6")
        self.hand.add_card(c)
        self.hand.add_card(c)
        self.assertEqual(len(self.hand), 2)

    def test_add_wildcard_joker(self):
        self.hand.add_card(JOKER)
        self.assertEqual(len(self.hand), 1)


# ---------------------------------------------------------------------------
# 3. discard_card
# ---------------------------------------------------------------------------

class TestHandDiscardCard(unittest.TestCase):
    def setUp(self):
        self.hand = Hand()
        self.c1 = make_card("4")
        self.c2 = make_card("8")
        self.hand.add_card(self.c1)
        self.hand.add_card(self.c2)

    def test_discard_existing_card_reduces_len(self):
        self.hand.discard_card(self.c1)
        self.assertEqual(len(self.hand), 1)

    def test_discard_leaves_other_card_intact(self):
        self.hand.discard_card(self.c1)
        self.assertIn(self.c2, self.hand.get_cards())

    def test_discard_last_card_makes_hand_empty(self):
        self.hand.discard_card(self.c1)
        self.hand.discard_card(self.c2)
        self.assertTrue(self.hand.is_empty())

    def test_discard_card_not_in_hand_raises_value_error(self):
        with self.assertRaises(ValueError):
            self.hand.discard_card(make_card("K"))

    def test_discard_from_empty_hand_raises_value_error(self):
        empty = Hand()
        with self.assertRaises(ValueError):
            empty.discard_card(make_card("3"))


# ---------------------------------------------------------------------------
# 4. deadwood / calculate_value — scoring partitions
# ---------------------------------------------------------------------------

class TestHandDeadwood(unittest.TestCase):
    def _hand_with(self, *cards):
        h = Hand()
        for c in cards:
            h.add_card(c)
        return h

    def test_number_cards_use_face_value(self):
        # 3 + 7 + 9 = 19
        h = self._hand_with(make_card("3"), make_card("7"), make_card("9"))
        self.assertEqual(h.deadwood(), 19)

    def test_ten_counts_as_ten(self):
        h = self._hand_with(make_card("10"))
        self.assertEqual(h.deadwood(), 10)

    def test_face_cards_each_worth_10(self):
        # J + Q + K = 30
        h = self._hand_with(make_card("J"), make_card("Q"), make_card("K"))
        self.assertEqual(h.deadwood(), 30)

    def test_ace_worth_20(self):
        h = self._hand_with(make_card("A"))
        self.assertEqual(h.deadwood(), 20)

    def test_joker_worth_50(self):
        h = self._hand_with(JOKER)
        self.assertEqual(h.deadwood(), 50)

    def test_two_of_clubs_wildcard_worth_50(self):
        h = self._hand_with(TWO_OF_CLUBS)
        self.assertEqual(h.deadwood(), 50)

    def test_mixed_hand_sums_correctly(self):
        # 5 + 10(face) + 20(Ace) + 50(Joker) = 85
        h = self._hand_with(
            make_card("5"),
            make_card("J"),
            make_card("A"),
            JOKER,
        )
        self.assertEqual(h.deadwood(), 85)

    def test_calculate_value_equals_deadwood(self):
        h = self._hand_with(make_card("6"), make_card("Q"), make_card("A"))
        self.assertEqual(h.calculate_value(), h.deadwood())


# ---------------------------------------------------------------------------
# 5. sort_cards
# ---------------------------------------------------------------------------

class TestHandSortCards(unittest.TestCase):
    def test_sort_ascending_by_rank(self):
        h = Hand()
        for rank in ("K", "3", "7"):
            h.add_card(make_card(rank))
        h.sort_cards()
        self.assertEqual([c.rank for c in h.get_cards()], ["3", "7", "K"])

    def test_already_sorted_unchanged(self):
        h = Hand()
        for rank in ("3", "5", "8"):
            h.add_card(make_card(rank))
        h.sort_cards()
        self.assertEqual([c.rank for c in h.get_cards()], ["3", "5", "8"])

    def test_reverse_sorted_becomes_ascending(self):
        h = Hand()
        for rank in ("Q", "9", "4"):
            h.add_card(make_card(rank))
        h.sort_cards()
        self.assertEqual([c.rank for c in h.get_cards()], ["4", "9", "Q"])

    def test_tie_same_rank_broken_by_suit(self):
        # CLUBS (suit_value=1) before SPADES (suit_value=4)
        h = Hand()
        h.add_card(Card(suit="SPADES", rank="5"))
        h.add_card(Card(suit="CLUBS", rank="5"))
        h.sort_cards()
        self.assertEqual([c.suit for c in h.get_cards()], ["CLUBS", "SPADES"])

    def test_joker_sorts_after_king(self):
        h = Hand()
        h.add_card(JOKER)
        h.add_card(make_card("K"))
        h.add_card(make_card("5"))
        h.sort_cards()
        self.assertEqual(h.get_cards()[-1].rank, "JOKER")

    def test_ace_sorts_after_king_before_joker(self):
        h = Hand()
        h.add_card(JOKER)
        h.add_card(make_card("A"))
        h.add_card(make_card("K"))
        h.sort_cards()
        ranks = [c.rank for c in h.get_cards()]
        self.assertEqual(ranks, ["K", "A", "JOKER"])


# ---------------------------------------------------------------------------
# 6. get_cards — mutation isolation
# ---------------------------------------------------------------------------

class TestHandGetCards(unittest.TestCase):
    def test_returns_list(self):
        h = Hand()
        h.add_card(make_card("6"))
        self.assertIsInstance(h.get_cards(), list)

    def test_returned_list_is_a_copy(self):
        h = Hand()
        h.add_card(make_card("6"))
        snapshot = h.get_cards()
        snapshot.clear()           # mutate the returned copy
        self.assertEqual(len(h), 1)  # internal state unchanged

    def test_get_card_is_alias_for_get_cards(self):
        h = Hand()
        h.add_card(make_card("9"))
        self.assertEqual(h.get_card(), h.get_cards())

    def test_contains_all_added_cards(self):
        h = Hand()
        cards = [make_card(r) for r in ("3", "7", "J")]
        for c in cards:
            h.add_card(c)
        self.assertEqual(set(h.get_cards()), set(cards))


# ---------------------------------------------------------------------------
# 9. __repr__
# ---------------------------------------------------------------------------

class TestHandRepr(unittest.TestCase):
    def test_empty_repr(self):
        self.assertEqual(repr(Hand()), "Hand([])")

    def test_repr_contains_card_string(self):
        h = Hand()
        h.add_card(Card(suit="HEARTS", rank="7"))
        self.assertIn("7 of HEARTS", repr(h))

    def test_repr_contains_joker(self):
        h = Hand()
        h.add_card(JOKER)
        self.assertIn("JOKER", repr(h))


if __name__ == "__main__":
    unittest.main()
