"""
RIYA

Player (Abstract Base Class)

Responsibility:
- Represents a participant in the game.
- Stores player name.
- Stores player hand.
- Stores player score.
- Defines the required take_turn() method.

Subclasses must implement take_turn().

The Player class does NOT:
- Control round progression.
- Validate game rules.
- Directly manipulate the deck without Round mediation.
"""

from abc import ABC, abstractmethod

from app.hands import Hand


class Player(ABC):
    def __init__(self, name):
        self.name = name
        self.hand = Hand()
        self.score = 0
        self.has_laid_down = False  # works with rules engine

    def reset_for_new_round(self):
        """Called by Game before each round starts."""
        self.hand = Hand()
        self.has_laid_down = False

    @abstractmethod
    def take_turn(self, current_round):
        pass

    def __repr__(self):
        return f"{self.__class__.__name__}(name={self.name!r})"

        
