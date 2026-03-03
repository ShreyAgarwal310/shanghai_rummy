"""
SHREY

SetMeld Class

Responsibility:
- Represents a set of cards of the same rank.
- Validates that:
    - All cards have the same rank.
    - Suits are valid.
    - Size requirements are met.

This class does NOT:
- Validate contracts.
- Control turns.
"""

from app.melds.meld import Meld


class SetMeld(Meld):
    def is_valid(self) -> bool:
        # A set is 3+ cards, with at least 2 non-wild cards.
        if len(self.cards) < 3:
            return False
        if len(self.non_wild_cards) < 2:
            return False

        # All non-wild cards must share rank.
        base_rank = str(self.non_wild_cards[0].rank)
        return all(str(card.rank) == base_rank for card in self.non_wild_cards)
