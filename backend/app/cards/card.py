"""
SHREY

Card Class

Responsibility:
- Represents a single playing card.
- Stores suit and rank.
- Identifies whether it is a wildcard.
- Returns its point value for scoring.

The Card class is a pure data object.
It does NOT:
- Know about players.
- Know about decks.
- Validate melds.
"""

from dataclasses import dataclass
from typing import Any, Optional, Union


@dataclass(frozen=True)
class Card:
    suit: Optional[str]
    rank: Union[str, int]

    _VALID_SUITS = {"CLUBS", "DIAMONDS", "HEARTS", "SPADES", "JOKER"}
    _WILDCARD_RANKS = {"JOKER"}
    _FACE_CARD_POINTS = {"10": 10, "J": 10, "Q": 10, "K": 10}

    def __post_init__(self) -> None:
        normalized_rank = self._normalize_rank(self.rank)
        normalized_suit = self._normalize_suit(self.suit, normalized_rank)

        object.__setattr__(self, "rank", normalized_rank)
        object.__setattr__(self, "suit", normalized_suit)

        if normalized_suit not in self._VALID_SUITS:
            raise ValueError(f"Invalid suit: {self.suit}")

    @property
    def is_wildcard(self) -> bool:
        """True for jokers and 2 of clubs."""
        return str(self.rank) in self._WILDCARD_RANKS or (
            str(self.rank) == "2" and self.suit == "CLUBS"
        )

    @property
    def point_value(self) -> int:
        """
        Shanghai scoring for deadwood:
        - Jokers and wildcards: 50
        - Ace: 20
        - 10/J/Q/K: 10
        - Other number cards: face value
        """
        rank = str(self.rank)

        if self.is_wildcard:
            return 50
        if rank == "A":
            return 20
        if rank in self._FACE_CARD_POINTS:
            return self._FACE_CARD_POINTS[rank]

        return int(rank)
    
    @property
    def sort_value(self) -> int:
        order = {
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8,
            "9": 9,
            "10": 10,
            "J": 11,
            "Q": 12,
            "K": 13,
            "A": 14,
            "JOKER": 15
    }
        return order[self.rank]

    @property
    def suit_value(self) -> int:
        suit_order = {
            "CLUBS": 1,
            "DIAMONDS": 2,
            "HEARTS": 3,
            "SPADES": 4,
            "JOKER": 5
    }
        return suit_order[self.suit]

    def __str__(self) -> str:
        if self.rank == "JOKER":
            return "JOKER"
        return f"{self.rank} of {self.suit}"

    @staticmethod
    def _normalize_rank(rank: Any) -> str:
        if isinstance(rank, int):
            if rank < 2 or rank > 14:
                raise ValueError(f"Invalid rank: {rank}")
            if rank == 11:
                return "J"
            if rank == 12:
                return "Q"
            if rank == 13:
                return "K"
            if rank == 14:
                return "A"
            return str(rank)

        if not isinstance(rank, str):
            raise ValueError(f"Invalid rank type: {type(rank).__name__}")

        rank_str = rank.strip().upper()
        if rank_str in {"A", "J", "Q", "K", "JOKER"}:
            return rank_str
        if rank_str.isdigit() and 2 <= int(rank_str) <= 10:
            return rank_str

        raise ValueError(f"Invalid rank: {rank}")

    @staticmethod
    def _normalize_suit(suit: Optional[str], normalized_rank: str) -> str:
        if normalized_rank == "JOKER":
            return "JOKER"
        if suit is None:
            raise ValueError("Suit is required for non-joker cards")
        return suit.strip().upper()
