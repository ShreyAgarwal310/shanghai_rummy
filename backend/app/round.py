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


try:
    from app.cards.deck import Deck
    from app.cards.discard_pile import DiscardPile
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
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
            current_player.take_turn(self)
            
            if current_player.hand.is_empty():
                self.is_complete = True
                print(f"Round Over! {current_player.name} went out.")
            else:
                self.next_turn()
    
    def next_turn(self):
        self.current_player_index = (self.current_player_index + 1) % len(self.players)

    def handle_draw(self, player):
        """Handle player drawing a card (from deck or discard). TODO: implement draw source choice."""
        card = self.deck.draw()
        if card:
            player.hand.add_card(card)

    def handle_play(self, player):
        """Handle player playing melds and discarding. TODO: implement meld/discard flow."""
        pass

    def calculate_scores(self):
        return {
            player.name: player.hand.calculate_value()
            for player in self.players
        }
