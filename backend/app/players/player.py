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