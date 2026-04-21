import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.melds.run_meld import RunMeld

# Helpers

def H(rank):
    """A HEARTS card with the given rank string (non-wildcard for most ranks)."""
    return Card(suit="HEARTS", rank=rank)


def WILD():
    """A Joker wildcard."""
    return Card(suit="JOKER", rank="JOKER")


def WILD2():
    """The 2 of Clubs — also a wildcard by Shanghai rules."""
    return Card(suit="CLUBS", rank="2")


# 1. Size / structural constraints

class TestRunMeldSizeConstraints(unittest.TestCase):

    def test_three_cards_invalid(self):
        """Runs must contain at least 4 cards."""
        meld = RunMeld([H("4"), H("5"), H("6")])
        self.assertFalse(meld.is_valid())

    def test_four_consecutive_cards_valid(self):
        meld = RunMeld([H("4"), H("5"), H("6"), H("7")])
        self.assertTrue(meld.is_valid())

    def test_five_consecutive_cards_valid(self):
        meld = RunMeld([H("4"), H("5"), H("6"), H("7"), H("8")])
        self.assertTrue(meld.is_valid())

    def test_seven_consecutive_cards_valid(self):
        meld = RunMeld([H("3"), H("4"), H("5"), H("6"), H("7"), H("8"), H("9")])
        self.assertTrue(meld.is_valid())

    def test_only_wildcards_invalid(self):
        """Zero non-wild cards — cannot determine suit or sequence."""
        meld = RunMeld([WILD(), WILD(), WILD(), WILD()])
        self.assertFalse(meld.is_valid())

    def test_one_non_wild_three_wilds_invalid(self):
        """Fewer than 2 non-wildcards: sequence is indeterminate."""
        meld = RunMeld([H("5"), WILD(), WILD(), WILD()])
        self.assertFalse(meld.is_valid())

    def test_two_non_wilds_is_minimum_valid(self):
        """Exactly 2 non-wildcards with 2 wildcards filling the ends."""
        # 5-WILD-7-WILD → sorted [5,7], gap=2 → 1 required wild, 1 extra
        # slot_capacity=3, remaining=2, extra_wild=1 → OK
        meld = RunMeld([H("5"), WILD(), H("7"), WILD()])
        self.assertTrue(meld.is_valid())


# 2. Suit homogeneity

class TestRunMeldSuitConstraints(unittest.TestCase):

    def test_all_non_wilds_same_suit_valid(self):
        meld = RunMeld([
            Card(suit="SPADES", rank="9"),
            Card(suit="SPADES", rank="10"),
            Card(suit="SPADES", rank="J"),
            Card(suit="SPADES", rank="Q"),
        ])
        self.assertTrue(meld.is_valid())

    def test_one_non_wild_different_suit_invalid(self):
        meld = RunMeld([
            H("4"),
            Card(suit="SPADES", rank="5"),
            H("6"),
            H("7"),
        ])
        self.assertFalse(meld.is_valid())

    def test_wildcard_suit_does_not_affect_suit_check(self):
        """Wildcard suit is ignored when verifying suit homogeneity."""
        meld = RunMeld([H("4"), WILD(), H("6"), H("7")])
        self.assertTrue(meld.is_valid())

    def test_two_of_clubs_wildcard_suit_ignored(self):
        """2 of Clubs (CLUBS suit) is a wildcard — CLUBS is not a disqualifying suit."""
        meld = RunMeld([H("4"), WILD2(), H("6"), H("7")])
        self.assertTrue(meld.is_valid())


# 3. Sequence and gap logic (no wildcards)

class TestRunMeldGapsNoWildcards(unittest.TestCase):

    def test_gap_of_one_throughout_valid(self):
        """All ranks consecutive: no wildcards needed."""
        meld = RunMeld([H("8"), H("9"), H("10"), H("J")])
        self.assertTrue(meld.is_valid())

    def test_gap_of_two_without_wildcard_invalid(self):
        """4-5-7 has a gap of 2 but no wildcard to fill it."""
        meld = RunMeld([H("4"), H("5"), H("7"), H("8")])
        self.assertFalse(meld.is_valid())

    def test_gap_of_three_invalid(self):
        """A gap ≥ 3 can never be filled (would need adjacent wildcards)."""
        meld = RunMeld([H("4"), H("5"), H("9"), H("10")])
        self.assertFalse(meld.is_valid())

    def test_non_consecutive_scattered_invalid(self):
        meld = RunMeld([H("2"), H("5"), H("9"), H("K")])
        self.assertFalse(meld.is_valid())


# 4. Wildcard fills internal gap

class TestRunMeldWildcardFillsGap(unittest.TestCase):

    def test_single_wildcard_fills_internal_gap(self):
        # 4 - WILD - 6 - 7  →  4-5-6-7  (gap between 4 and 6 filled)
        meld = RunMeld([H("4"), WILD(), H("6"), H("7")])
        self.assertTrue(meld.is_valid())

    def test_two_wildcards_fill_two_separate_gaps(self):
        # 4-WILD-6-WILD-8 → 4-5-6-7-8
        meld = RunMeld([H("4"), WILD(), H("6"), WILD(), H("8")])
        self.assertTrue(meld.is_valid())

    def test_wildcard_cannot_fill_gap_of_three(self):
        # 4-WILD-8 has a gap of 4 between 4 and 8; a single wild only closes gap-of-2
        meld = RunMeld([H("4"), WILD(), H("8"), H("9")])
        self.assertFalse(meld.is_valid())

    def test_two_of_clubs_wildcard_fills_internal_gap(self):
        meld = RunMeld([H("6"), WILD2(), H("8"), H("9")])
        self.assertTrue(meld.is_valid())


# 5. Adjacent wildcard rule

class TestRunMeldAdjacentWildcards(unittest.TestCase):

    def test_two_wildcards_internal_adjacent_invalid(self):
        # The only positions for two wilds touching each other are consecutive
        # slots — the rules forbid this.
        meld = RunMeld([H("4"), WILD(), WILD(), H("7")])
        self.assertFalse(meld.is_valid())

    def test_joker_and_two_of_clubs_adjacent_invalid(self):
        meld = RunMeld([H("4"), WILD(), WILD2(), H("7")])
        self.assertFalse(meld.is_valid())

    def test_two_wildcards_at_both_ends_valid(self):
        # WILD - 5 - 6 - 7 - WILD  (non-adjacent: one prepended, one appended)
        meld = RunMeld([WILD(), H("5"), H("6"), H("7"), WILD()])
        self.assertTrue(meld.is_valid())

    def test_wildcard_at_start_valid(self):
        # WILD - 5 - 6 - 7  →  4-5-6-7
        meld = RunMeld([WILD(), H("5"), H("6"), H("7")])
        self.assertTrue(meld.is_valid())

    def test_wildcard_at_end_valid(self):
        # 5 - 6 - 7 - WILD  →  5-6-7-8
        meld = RunMeld([H("5"), H("6"), H("7"), WILD()])
        self.assertTrue(meld.is_valid())


# 6. Slot-capacity overflow

class TestRunMeldSlotCapacity(unittest.TestCase):

    def test_too_many_wildcards_for_non_adjacent_slots_invalid(self):
        # 2 non-wilds → slot_capacity = 3 (before, between, after)
        # 4 extra wildcards > 3 available slots → invalid
        meld = RunMeld([H("5"), H("6"), WILD(), WILD(), WILD(), WILD()])
        self.assertFalse(meld.is_valid())

    def test_wildcards_exactly_at_slot_capacity_valid(self):
        # 2 non-wilds → slot_capacity = 3, 3 extra wildcards fills all 3 slots
        # WILD - 5 - WILD - 6 - WILD  (5 cards; gap between 5 and 6 is 1, required_wild=0)
        # extra_wild=3, remaining_capacity=3 → 3 ≤ 3 → valid
        meld = RunMeld([WILD(), H("5"), WILD(), H("6"), WILD()])
        self.assertTrue(meld.is_valid())


# 7. Ace ambiguity (high / low / wrap)

class TestRunMeldAceHandling(unittest.TestCase):

    def test_ace_low_a2_3_4_valid(self):
        meld = RunMeld([H("A"), H("2"), H("3"), H("4")])
        self.assertTrue(meld.is_valid())

    def test_ace_high_jqka_valid(self):
        meld = RunMeld([H("J"), H("Q"), H("K"), H("A")])
        self.assertTrue(meld.is_valid())

    def test_ace_wrap_qka2_invalid(self):
        """An Ace cannot be used to 'wrap around' from K to 2."""
        meld = RunMeld([H("Q"), H("K"), H("A"), H("2")])
        self.assertFalse(meld.is_valid())

    def test_ace_low_with_wildcard(self):
        # A - WILD - 3 - 4  →  A(1)-2-3-4
        meld = RunMeld([H("A"), WILD(), H("3"), H("4")])
        self.assertTrue(meld.is_valid())

    def test_ace_high_with_wildcard(self):
        # Q - K - WILD - A  →  Q(12)-K(13)-?-A(14): gap between K and A is 1, no wild needed
        # Better: J - WILD - K - A → J(11)-?-K(13)-A(14): gap=2 filled by wild
        meld = RunMeld([H("J"), WILD(), H("K"), H("A")])
        self.assertTrue(meld.is_valid())


# 8. Private helpers — tested directly to confirm sub-contracts

class TestRankOptions(unittest.TestCase):
    """_rank_options maps a rank string to its possible integer values."""

    def test_ace_returns_both_values(self):
        self.assertEqual(RunMeld._rank_options("A"), [1, 14])

    def test_number_returns_single_value(self):
        self.assertEqual(RunMeld._rank_options("7"), [7])

    def test_ten_returns_ten(self):
        self.assertEqual(RunMeld._rank_options("10"), [10])

    def test_jack_returns_eleven(self):
        self.assertEqual(RunMeld._rank_options("J"), [11])

    def test_queen_returns_twelve(self):
        self.assertEqual(RunMeld._rank_options("Q"), [12])

    def test_king_returns_thirteen(self):
        self.assertEqual(RunMeld._rank_options("K"), [13])


class TestExpandRankAssignments(unittest.TestCase):
    """_expand_rank_assignments produces the Cartesian product of rank options."""

    def test_no_ambiguity_single_assignment(self):
        result = RunMeld._expand_rank_assignments([[5], [6], [7]])
        self.assertEqual(result, [[5, 6, 7]])

    def test_ace_doubles_the_assignments(self):
        # Ace at position 0: [1,14] × [5] → [[1,5],[14,5]]
        result = RunMeld._expand_rank_assignments([[1, 14], [5]])
        self.assertIn([1, 5], result)
        self.assertIn([14, 5], result)
        self.assertEqual(len(result), 2)

    def test_two_aces_produces_four_assignments(self):
        result = RunMeld._expand_rank_assignments([[1, 14], [1, 14]])
        self.assertEqual(len(result), 4)


class TestIsSequencePossible(unittest.TestCase):
    """_is_sequence_possible validates gap and slot constraints."""

    def test_consecutive_ranks_no_wilds(self):
        self.assertTrue(RunMeld._is_sequence_possible([4, 5, 6, 7], 0, 4))

    def test_gap_of_two_filled_by_one_wild(self):
        # [4, 6]: gap=2 → requires 1 wild; total cards = 3 (4, WILD, 6)
        self.assertTrue(RunMeld._is_sequence_possible([4, 6], 1, 3))

    def test_gap_of_three_impossible(self):
        # [4, 7]: gap=3 → cannot be filled (would need adjacent wilds)
        self.assertFalse(RunMeld._is_sequence_possible([4, 7], 1, 3))

    def test_gap_of_two_no_wild_available(self):
        # [4, 6] needs 1 wild but 0 provided
        self.assertFalse(RunMeld._is_sequence_possible([4, 6], 0, 2))

    def test_slot_capacity_exceeded(self):
        # [5, 6]: consecutive, 0 required wilds, slot_capacity=3
        # extra_wild = 4, remaining_capacity = 3 → 4 > 3 → False
        self.assertFalse(RunMeld._is_sequence_possible([5, 6], 4, 6))

    def test_slot_capacity_exactly_met(self):
        # [5, 6]: slot_capacity=3, extra_wild=3 → 3 ≤ 3 → True
        self.assertTrue(RunMeld._is_sequence_possible([5, 6], 3, 5))

    def test_duplicate_ranks_invalid(self):
        # Duplicate ranks mean the Cartesian filter catches it before this is
        # called, but the function itself should reject gap ≤ 0.
        self.assertFalse(RunMeld._is_sequence_possible([5, 5, 6], 0, 3))


if __name__ == "__main__":
    unittest.main()
