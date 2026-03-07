"""
SHREY

RunMeld Class

Responsibility:
- Represents a run of consecutive cards in the same suit.
- Validates that:
    - All cards share the same suit.
    - Ranks are consecutive.
    - Size requirements are met.

This class does NOT:
- Validate contracts.
- Control turns.
"""

from typing import List

try:
    from app.melds.meld import Meld
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from app.melds.meld import Meld


class RunMeld(Meld):
    def is_valid(self) -> bool:
        # A run is 4+ cards with at least 2 non-wild cards.
        if len(self.cards) < 4:
            return False
        if len(self.non_wild_cards) < 2:
            return False

        # All non-wild cards must be same suit.
        suit = self.non_wild_cards[0].suit
        if any(card.suit != suit for card in self.non_wild_cards):
            return False

        wild_count = len(self.wild_cards)
        total_cards = len(self.cards)

        # Ace can be high or low (no wrap). Try both mappings where needed.
        rank_options = [self._rank_options(card.rank) for card in self.non_wild_cards]
        for assignment in self._expand_rank_assignments(rank_options):
            if len(set(assignment)) != len(assignment):
                continue
            ranks = sorted(assignment)
            if self._is_sequence_possible(ranks, wild_count, total_cards):
                return True

        return False

    @staticmethod
    def _rank_options(rank: str) -> List[int]:
        rank_map = {
            "2": [2],
            "3": [3],
            "4": [4],
            "5": [5],
            "6": [6],
            "7": [7],
            "8": [8],
            "9": [9],
            "10": [10],
            "J": [11],
            "Q": [12],
            "K": [13],
            "A": [1, 14],
        }
        return rank_map[str(rank)]

    @classmethod
    def _expand_rank_assignments(cls, rank_options: List[List[int]]) -> List[List[int]]:
        assignments: List[List[int]] = [[]]
        for options in rank_options:
            next_assignments: List[List[int]] = []
            for prefix in assignments:
                for option in options:
                    next_assignments.append(prefix + [option])
            assignments = next_assignments
        return assignments

    @staticmethod
    def _is_sequence_possible(sorted_ranks: List[int], wild_count: int, total_cards: int) -> bool:
        # Internal gaps consume required wildcards. Any gap > 2 implies
        # adjacent wildcards would be required, which is not allowed.
        required_wild = 0
        for idx in range(len(sorted_ranks) - 1):
            gap = sorted_ranks[idx + 1] - sorted_ranks[idx]
            if gap <= 0:
                return False
            if gap > 2:
                return False
            if gap == 2:
                required_wild += 1

        if required_wild > wild_count:
            return False

        # Available insertion slots where at most one wild can appear
        # without touching another wild:
        # before first, between each non-wild pair, after last.
        non_wild_count = len(sorted_ranks)
        slot_capacity = non_wild_count + 1

        # Slots already consumed by required internal wildcards.
        remaining_capacity = slot_capacity - required_wild
        extra_wild = wild_count - required_wild
        if extra_wild > remaining_capacity:
            return False

        return non_wild_count + wild_count == total_cards
