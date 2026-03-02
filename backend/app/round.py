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
    
    def prepare_round(self):
        """Shuffles and deals 11 cards"""
        self.deck.shuffle()
        for _ in range(11):
            for player in self.players:
                player.hand.add_card(self.deck.draw())
        
        # Start the discard pile
        self.discard_pile.add_card(self.deck.draw())

    def start(self):
        """Main loop for the round."""
        self.prepare_round()
        
        while not self.is_complete:
            current_player = self.players[self.current_player_index]
            
            # calls method from player
            current_player.take_turn(self.deck, self.discard_pile, self.contract)
            
            if current_player.hand.is_empty():
                self.is_complete = True
                print(f"Round Over! {current_player.name} went out.")
            else:
                self.next_turn()