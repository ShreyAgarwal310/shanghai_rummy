"""
RIYA & EMILY

Round Class

Responsibility:
- Controls one full round of Shanghai Rummy.
- Creates and manages the Deck.
- Creates and manages the DiscardPile.
- Deals cards to players.
- Tracks whose turn it is.
- Calls player.take_turn().
- Detects when a player goes out.
- Calculates round scores.

The Round class does NOT:
- Track total game scores.
- Validate meld legality (RulesEngine handles this).
- Contain direct user input logic.
"""


from app.cards.deck import Deck
from app.cards.discard_pile import DiscardPile

class Round:
    def __init__(self, players, round_number, contract):
        self.players = players
        self.round_number = round_number
        self.contract = contract  
        self.deck = Deck()
        self.discard_pile = DiscardPile()
        self.current_player_index = 0
        self.is_complete = False