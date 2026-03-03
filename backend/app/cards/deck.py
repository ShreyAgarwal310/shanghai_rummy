"""
SHREY

Deck Class

Responsibility:
- Creates all cards for a round.
- Shuffles cards.
- Allows cards to be drawn.
- Tracks whether the deck is empty.

The Deck class does NOT:
- Know about players.
- Know about scoring.
- Enforce game rules.
"""

import random
from typing import List

from app.cards.card import Card


class Deck:
    def __init__(self, num_decks: int = 2, jokers_per_deck: int = 2):
        self._cards: List[Card] = []
        suits = ("CLUBS", "DIAMONDS", "HEARTS", "SPADES")
        ranks = [str(n) for n in range(2, 11)] + ["J", "Q", "K", "A"]

        for _ in range(num_decks):
            for suit in suits:
                for rank in ranks:
                    self._cards.append(Card(suit=suit, rank=rank))
            for _ in range(jokers_per_deck):
                self._cards.append(Card(suit="JOKER", rank="JOKER"))

    def shuffle(self) -> None:
        random.shuffle(self._cards)

    def draw(self) -> Card:
        if self.is_empty():
            raise IndexError("Cannot draw from an empty deck")
        return self._cards.pop()

    def is_empty(self) -> bool:
        return len(self._cards) == 0

    def __len__(self) -> int:
        return len(self._cards)
