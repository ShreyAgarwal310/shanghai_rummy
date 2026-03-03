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


class Player:
    def __init__(self, players):
            self.players = players
            self.game_start = False
            self.score = 0


    if begin_game = True:
        username = input('What is your username?')

        #would keep the name in the database??
