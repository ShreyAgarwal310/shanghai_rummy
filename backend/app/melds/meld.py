"""
SHREY

Meld (Abstract Base Class)

Responsibility:
- Represents a group of cards played together.
- Stores the cards in the meld.
- Defines is_valid() method for subclasses.

Subclasses:
- SetMeld
- RunMeld

The Meld class does NOT:
- Control game flow.
- Track scoring.
"""

from abc import ABC, abstractmethod
from typing import List

try:
    from app.cards.card import Card
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from app.cards.card import Card


class Meld(ABC):
    def __init__(self, cards: List[Card]):
        self.cards = cards

    @abstractmethod
    def is_valid(self) -> bool:
        raise NotImplementedError

    @property
    def non_wild_cards(self) -> List[Card]:
        return [card for card in self.cards if not card.is_wildcard]

    @property
    def wild_cards(self) -> List[Card]:
        return [card for card in self.cards if card.is_wildcard]
