"""
SHREY

DiscardPile Class

Responsibility:
- Stores discarded cards.
- Allows adding a card to the pile.
- Allows viewing the top card.
- Allows taking the top card.

The DiscardPile class does NOT:
- Validate moves.
- Track players.
- Control turns.
"""

from typing import List, Optional

from app.cards.card import Card


class DiscardPile:
    def __init__(self):
        self._cards: List[Card] = []

    def add_card(self, card: Card) -> None:
        self._cards.append(card)

    def top_card(self) -> Optional[Card]:
        if not self._cards:
            return None
        return self._cards[-1]

    def take_top_card(self) -> Card:
        if not self._cards:
            raise IndexError("Cannot take a card from an empty discard pile")
        return self._cards.pop()

    def is_empty(self) -> bool:
        return len(self._cards) == 0

    def __len__(self) -> int:
        return len(self._cards)
