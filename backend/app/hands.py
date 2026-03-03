"""
RIYA

Hand Class

Responsibility:
- Manages the cards belonging to a single player.
- Adds and removes cards.
- Sorts cards.
- Calculates deadwood (remaining card points).
- Returns cards for meld evaluation.

The Hand class does NOT:
- Control turns.
- Validate contracts.
- Interact with other players.
"""

class Hand:
    def __init__(self):
        self.cards = [] #using a arraylist

    def draw_card (self, card):
        self.card.append(card)

    def discard_card(self, card):
        self.card.remove(card)

    def sort_cards(self):
        self.card.sort(key=lambda card: (card.sort_value, card.suit_value))

    def deadwood (self) -> int: # calculating remaining card pts
        return sum (card.point_value for card in self.cards)
    
    def get_card(self):
        return list(self.cards) #using list incase there are changes in the hand internal state