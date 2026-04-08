"""
EMILY

Computer Player Class

Responsibility:
- Implements automated decision-making for a player.
- Chooses draw source algorithmically.
- Chooses discard algorithmically.

This class does NOT:
- Validate rule legality.
- Control round progression.
"""
from .player import Player

class ComputerPlayer(Player):
    """ Implements automatic decision making for a player who drops out of the game """

    def __init__(self, name, player_id):
        super().init__(name)
        self.player_id = player_id

    def take_turn (self,current_round):
        """ the loop for the computers turn where it will draw, try to play melds, and discard"""

        print(f"\n{self.name} dropped out. Computer's Turn")

        self.draw_phase(current_round)

        self.discard_phase(current_round)
    
    def draw_phase(self,current_round):
        """ Draws a card from the deck and adds it to the hand """
        if not current_round.deck.is_empty():
            new_card = current_round.deck.draw()
            self.hand.add_card(new_card)
            print(f"{self.name} drew a card.")
        
        else:
            print("The deck is empty")

    def discard_phase(self,current_round):
        """computer discards first card in hand to keep all cards in play"""
        if len(self.hand) > 0:
            discard_card = self.hand.cards[0] 
            self.hand.discard_card(discard_card)
            current_round.discard_pile.add(discard_card)
            
            print(f"{self.name} discarded {discard_card} to the pile.")





