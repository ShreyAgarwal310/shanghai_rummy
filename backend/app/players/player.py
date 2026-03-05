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

import hands
import game
import main

from abc import ABC, abstractclassmethod

class Player:
    def __init__(self, name):
            self.name = name
            self.hand = Hand()
            self.score = 0
            self.has_laid_down = False # works with rules engine

    def reset_for_new_roud(self):
          # this will be called by game before each round starts
          self.hand = Hand()
          self.has_laid_down = False

        
def take_turn (self, round):
        pass

def __repr__(self):
       return f"{self.__class__.__name__}(name={self.name!r})"

        
